// Чистые преобразования объектов genshin-db в компактный формат сайта.
// Сам пакет здесь не импортируется, поэтому модуль тестируется без него.

import { escapeHtml } from '../../src/lib/escape-html.js';

export function slugify(englishName) {
  return englishName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ELEMENT_MAP = {
  ELEMENT_PYRO: 'pyro',
  ELEMENT_HYDRO: 'hydro',
  ELEMENT_ANEMO: 'anemo',
  ELEMENT_ELECTRO: 'electro',
  ELEMENT_CRYO: 'cryo',
  ELEMENT_GEO: 'geo',
  ELEMENT_DENDRO: 'dendro',
};

export function mapElement(elementType) {
  return ELEMENT_MAP[elementType] ?? 'none';
}

const WEAPON_MAP = {
  WEAPON_SWORD_ONE_HAND: 'sword',
  WEAPON_CLAYMORE: 'claymore',
  WEAPON_POLE: 'polearm',
  WEAPON_BOW: 'bow',
  WEAPON_CATALYST: 'catalyst',
};

export function mapWeapon(weaponType) {
  const weapon = WEAPON_MAP[weaponType];
  if (!weapon) throw new Error(`Unknown weaponType ${weaponType}`);
  return weapon;
}

// Новые значения associationType появляются с патчами; неизвестное значение
// должно ронять генерацию, а не молча превращаться в «Другое».
const REGION_MAP = {
  ASSOC_MONDSTADT: 'mondstadt',
  ASSOC_LIYUE: 'liyue',
  ASSOC_NODKRAI_ZIBAI: 'liyue',
  ASSOC_INAZUMA: 'inazuma',
  ASSOC_SUMERU: 'sumeru',
  ASSOC_FONTAINE: 'fontaine',
  ASSOC_NATLAN: 'natlan',
  ASSOC_NODKRAI: 'nodkrai',
  ASSOC_SNEZHNAYA: 'snezhnaya',
  ASSOC_SNEZHNAYA_STAR: 'snezhnaya',
  ASSOC_FATUI: 'snezhnaya',
  ASSOC_RANGER: 'other',
  ASSOC_HVISION: 'other',
  ASSOC_OMNI_SCOURGE: 'other',
  ASSOC_MAINACTOR: 'other',
};

export function mapRegion(associationType, englishName) {
  const region = REGION_MAP[associationType];
  if (!region) throw new Error(`Unknown associationType ${associationType} for ${englishName}`);
  return region;
}

/** Превращает игровой текст в безопасный HTML: только <b class="hl"> и <br>. */
export function cleanText(text) {
  if (!text) return '';
  const withoutTags = String(text).replace(/<\/?[a-zA-Z][^>]*>/g, '');
  return escapeHtml(withoutTags)
    .replace(/\*\*(.+?)\*\*/g, '<b class="hl">$1</b>')
    .replace(/\r?\n/g, '<br>');
}

export function formatSubstat(type, value) {
  if (!type || value === undefined || value === null) return null;
  if (type === 'FIGHT_PROP_ELEMENT_MASTERY') return String(Math.round(value));
  return `${(value * 100).toFixed(1).replace('.', ',')}%`;
}

export function sumCosts(costs) {
  const totals = new Map();
  for (const phase of Object.values(costs ?? {})) {
    for (const { name, count } of phase) totals.set(name, (totals.get(name) ?? 0) + count);
  }
  return [...totals].map(([name, count]) => ({ name, count }));
}

export function toCharacterSummary(ru, en) {
  return {
    slug: slugify(en.name),
    name: ru.name,
    title: ru.title ?? '',
    rarity: ru.rarity,
    element: mapElement(en.elementType),
    weapon: mapWeapon(en.weaponType),
    region: mapRegion(en.associationType, en.name),
    birthday: ru.birthday ?? '',
    constellation: ru.constellation ?? '',
    version: ru.version,
    icon: ru.images.filename_icon,
  };
}

const COMBAT_KEYS = ['combat1', 'combat2', 'combatsp', 'combat3'];
const PASSIVE_KEYS = ['passive1', 'passive2', 'passive3', 'passive4'];

function talentList(talents) {
  if (!talents) return [];
  const pick = (keys, kind) =>
    keys
      .filter((key) => talents[key])
      .map((key) => ({ kind, name: talents[key].name, html: cleanText(talents[key].description) }));
  return [...pick(COMBAT_KEYS, 'combat'), ...pick(PASSIVE_KEYS, 'passive')];
}

function constellationList(constellations) {
  if (!constellations) return [];
  return [1, 2, 3, 4, 5, 6]
    .filter((level) => constellations[`c${level}`])
    .map((level) => {
      const c = constellations[`c${level}`];
      return { level, name: c.name, html: cleanText(c.description) };
    });
}

export function toCharacterDetail(ru, en, talents, constellations) {
  return {
    slug: slugify(en.name),
    description: ru.description ?? '',
    affiliation: ru.affiliation ?? '',
    ascensionStat: ru.substatText ?? '',
    splash: ru.images.filename_gachaSplash ?? '',
    talents: talentList(talents),
    constellations: constellationList(constellations),
    materials: sumCosts(ru.costs),
  };
}

const TRAVELER_DESCRIPTION =
  'Путешественник из другого мира, разлучённый с близнецом. Странствует по Тейвату, чтобы найти Архонтов и вернуть родного человека.';

/** Итэр и Люмин — один играбельный персонаж, поэтому в каталоге одна запись. */
export function toTraveler(lumineRu, lumineEn) {
  const base = toCharacterSummary(lumineRu, lumineEn);
  return {
    summary: {
      ...base,
      slug: 'traveler',
      name: 'Путешественник',
      title: '',
      element: 'none',
      rarity: 5,
      region: 'other',
      birthday: '',
      constellation: '',
      version: '1.0',
    },
    detail: {
      slug: 'traveler',
      description: TRAVELER_DESCRIPTION,
      affiliation: '',
      ascensionStat: lumineRu.substatText ?? '',
      splash: lumineRu.images.filename_gachaSplash ?? '',
      talents: [],
      constellations: [],
      materials: [],
    },
  };
}

export function toWeapon(ru, en, stats90) {
  return {
    slug: slugify(en.name),
    name: ru.name,
    type: mapWeapon(en.weaponType),
    rarity: ru.rarity,
    baseAtk: Math.round(stats90.attack),
    substat: en.mainStatType
      ? { label: ru.mainStatText, value: formatSubstat(en.mainStatType, stats90.specialized) }
      : null,
    passive:
      ru.effectName && ru.r1 ? { name: ru.effectName, html: cleanText(ru.r1.description) } : null,
    icon: ru.images.filename_icon,
    version: ru.version,
  };
}

const bonus = (text) => (text ? cleanText(text) : null);

export function toArtifact(ru, en) {
  return {
    slug: slugify(en.name),
    name: ru.name,
    rarity: Math.max(...ru.rarityList),
    bonus1: bonus(ru.effect1Pc),
    bonus2: bonus(ru.effect2Pc),
    bonus4: bonus(ru.effect4Pc),
    icon: ru.images.filename_flower ?? ru.images.filename_circlet,
    version: ru.version,
  };
}

export function buildSearchIndex({ characters, weapons, artifacts }) {
  const entries = (list, type) => list.map(({ slug, name, icon }) => ({ type, slug, name, icon }));
  return [
    ...entries(characters, 'character'),
    ...entries(weapons, 'weapon'),
    ...entries(artifacts, 'artifact'),
  ];
}

export function assertUniqueSlugs(list, label) {
  const seen = new Map();
  for (const item of list) {
    const other = seen.get(item.slug);
    if (other)
      throw new Error(`Duplicate ${label} slug "${item.slug}": ${other.name} / ${item.name}`);
    seen.set(item.slug, item);
  }
}
