import { readJson, removeKey, writeJson } from './storage.js';

const KEY = 'gw_user';

/** Текущий вошедший пользователь или null. */
export function getCurrentUser() {
  const user = readJson(KEY, null);
  if (!user || typeof user.name !== 'string' || typeof user.email !== 'string') return null;
  return { name: user.name, email: user.email, joined: user.joined ?? '' };
}

export function setCurrentUser({ name, email, joined }) {
  writeJson(KEY, { name, email, joined, verified: true });
}

export function clearCurrentUser() {
  removeKey(KEY);
}
