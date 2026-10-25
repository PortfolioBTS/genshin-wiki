import { REGIONS, WEAPON_TYPES } from './labels.js';
import { matchesQuery } from './text.js';
import { compareVersions } from './versions.js';

const pass = (filter, value) => filter === 'all' || filter === String(value);

export function filterCharacters(list, { el, rarity, weapon, region, q }) {
  return list.filter(
    (c) =>
      pass(el, c.element) &&
      pass(rarity, c.rarity) &&
      pass(weapon, c.weapon) &&
      pass(region, c.region) &&
      matchesQuery(q, c.name, c.title, REGIONS[c.region], WEAPON_TYPES[c.weapon]),
  );
}

const byName = (a, b) => a.name.localeCompare(b.name, 'ru');

export function sortCharacters(list, sort) {
  const sorted = [...list];
  if (sort === 'new')
    return sorted.sort((a, b) => compareVersions(b.version, a.version) || byName(a, b));
  return sorted.sort(byName);
}

export function filterWeapons(list, { type, rarity, q }) {
  return list.filter(
    (w) => pass(type, w.type) && pass(rarity, w.rarity) && matchesQuery(q, w.name, w.passive?.name),
  );
}

export function filterArtifacts(list, { rarity, q }) {
  return list.filter((a) => pass(rarity, a.rarity) && matchesQuery(q, a.name));
}
