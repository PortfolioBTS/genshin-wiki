/** Приводит строку к виду для поиска: регистр, ё→е, пробелы. */
export function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim()
    .replace(/\s+/g, ' ');
}

export function matchesQuery(query, ...fields) {
  const q = normalize(query);
  if (!q) return true;
  return fields.some((field) => normalize(field).includes(q));
}
