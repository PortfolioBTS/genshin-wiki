const MAX_TEXT = 50;

/**
 * Читает состояние страницы из query-строки по схеме
 * `{ key: { default, values? } }`. Неизвестные значения заменяются дефолтом.
 */
export function parseQuery(search, schema) {
  const params = new URLSearchParams(search);
  const state = {};
  for (const [key, { default: fallback, values }] of Object.entries(schema)) {
    const raw = params.get(key);
    if (raw === null) state[key] = fallback;
    else if (values) state[key] = values.includes(raw) ? raw : fallback;
    else state[key] = raw.trim().slice(0, MAX_TEXT);
  }
  return state;
}

/** Обратное преобразование: дефолтные значения в URL не попадают. */
export function toQuery(state, schema) {
  const params = new URLSearchParams();
  for (const [key, { default: fallback }] of Object.entries(schema)) {
    const value = state[key];
    if (value !== undefined && value !== fallback) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}
