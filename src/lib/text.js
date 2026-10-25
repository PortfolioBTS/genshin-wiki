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

/** '2026-09-23' → '23.09.2026'. */
export function formatDate(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}.${month}.${year}`;
}
