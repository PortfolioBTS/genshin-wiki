import { normalize } from './text.js';

function rank(name, query) {
  if (name.startsWith(query)) return 0;
  if (name.split(' ').some((word) => word.startsWith(query))) return 1;
  if (name.includes(query)) return 2;
  return -1;
}

/** Поиск по индексу: начало имени, начало слова, затем вхождение. */
export function searchIndex(index, query, limit = 8) {
  const q = normalize(query);
  if (!q) return [];
  const buckets = [[], [], []];
  for (const item of index) {
    const r = rank(normalize(item.name), q);
    if (r >= 0) buckets[r].push(item);
  }
  return buckets.flat().slice(0, limit);
}

const CATALOG = { weapon: 'weapons.html', artifact: 'artifacts.html' };

export function resultHref(item) {
  if (item.type === 'character') return `character.html?id=${encodeURIComponent(item.slug)}`;
  return `${CATALOG[item.type]}?q=${encodeURIComponent(item.name)}`;
}
