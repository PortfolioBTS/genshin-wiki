// Генерирует src/data/generated/*.json из пакета genshin-db.
// Запуск: npm run data:update

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { latestVersion } from '../../src/lib/versions.js';
import {
  assertUniqueSlugs,
  buildSearchIndex,
  toArtifact,
  toCharacterDetail,
  toCharacterSummary,
  toTraveler,
  toWeapon,
} from './transform.mjs';

const require = createRequire(import.meta.url);
const genshin = require('genshin-db');
const { version: sourceVersion } = require('genshin-db/package.json');

const RU = { resultLanguage: 'Russian' };
const ALL = { matchCategories: true };
const OUT = join(import.meta.dirname, '../../src/data/generated');

// Служебные «персонажи», которых нет в обычном списке героев.
const SKIP_CHARACTERS = new Set(['Manekin', 'Manekina', 'Aether']);

const byName = (a, b) => a.name.localeCompare(b.name, 'ru');

// В списках имён встречаются повторы (несколько игровых вариантов одного
// предмета, например «Легендарный клинок Иссин»); по имени они дают одну запись.
const uniqueNames = (names) => [...new Set(names)];
const byRarityThenName = (a, b) => b.rarity - a.rarity || byName(a, b);

function buildCharacters() {
  const summaries = [];
  const details = [];
  for (const name of uniqueNames(genshin.characters('names', ALL))) {
    if (SKIP_CHARACTERS.has(name)) continue;
    const en = genshin.characters(name);
    const ru = genshin.characters(name, RU);
    if (name === 'Lumine') {
      const { summary, detail } = toTraveler(ru, en);
      summaries.push(summary);
      details.push(detail);
      continue;
    }
    summaries.push(toCharacterSummary(ru, en));
    details.push(
      toCharacterDetail(ru, en, genshin.talents(name, RU), genshin.constellations(name, RU)),
    );
  }
  return { summaries: summaries.sort(byName), details };
}

function buildWeapons() {
  return uniqueNames(genshin.weapons('names', ALL))
    .map((name) => ({ en: genshin.weapons(name), ru: genshin.weapons(name, RU) }))
    .filter(({ ru }) => ru.rarity >= 3)
    .map(({ en, ru }) => toWeapon(ru, en, en.stats(90)))
    .sort(byRarityThenName);
}

function buildArtifacts() {
  return uniqueNames(genshin.artifacts('names', ALL))
    .map((name) => ({ en: genshin.artifacts(name), ru: genshin.artifacts(name, RU) }))
    .filter(({ ru }) => Math.max(...ru.rarityList) >= 4)
    .map(({ en, ru }) => toArtifact(ru, en))
    .sort(byRarityThenName);
}

function write(file, data) {
  writeFileSync(join(OUT, file), JSON.stringify(data, null, 2) + '\n');
}

const { summaries: characters, details } = buildCharacters();
const weapons = buildWeapons();
const artifacts = buildArtifacts();

assertUniqueSlugs(characters, 'characters');
assertUniqueSlugs(weapons, 'weapons');
assertUniqueSlugs(artifacts, 'artifacts');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'characters'), { recursive: true });

write('characters.json', characters);
for (const detail of details) write(`characters/${detail.slug}.json`, detail);
write('weapons.json', weapons);
write('artifacts.json', artifacts);
write('search-index.json', buildSearchIndex({ characters, weapons, artifacts }));
write('meta.json', {
  source: 'genshin-db',
  sourceVersion,
  latestVersion: latestVersion(characters.map((c) => c.version)),
  counts: { characters: characters.length, weapons: weapons.length, artifacts: artifacts.length },
});

console.log(
  `genshin-db ${sourceVersion}: ${characters.length} персонажей, ${weapons.length} оружия, ${artifacts.length} сетов`,
);
