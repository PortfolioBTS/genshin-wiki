import { readJson, removeKey, writeJson } from './storage.js';

const KEY = 'gw_user';

/** Текущий вошедший пользователь или null. */
export function getCurrentUser() {
  const user = readJson(KEY, null);
  if (!user || typeof user.name !== 'string' || typeof user.email !== 'string') return null;
  return { name: user.name, email: user.email, joined: user.joined ?? '' };
}

/** Возвращает false, если браузер не дал сохранить данные. */
export function setCurrentUser({ name, email, joined }) {
  return writeJson(KEY, { name, email, joined, verified: true });
}

export function clearCurrentUser() {
  removeKey(KEY);
}
