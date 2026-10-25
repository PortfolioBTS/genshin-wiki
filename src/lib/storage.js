// localStorage может быть недоступен (приватный режим, запрет cookies) или
// содержать испорченные данные — в обоих случаях страница должна работать.

export function readJson(key, fallback) {
  try {
    const raw = globalThis.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key) {
  try {
    globalThis.localStorage.removeItem(key);
  } catch {
    // нечего удалять, если хранилище недоступно
  }
}
