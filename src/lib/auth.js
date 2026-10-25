// Демо-аккаунты: пользователи живут только в localStorage этого браузера.
// Пароли хешируются PBKDF2-SHA-256 с солью — даже в демо не храним их в
// обратимом виде.

import { readJson, writeJson } from './storage.js';

export const PBKDF2_ITERATIONS = 600000;
const USERS_KEY = 'gw_users';

const toHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((byte) => Number.parseInt(byte, 16)));

function randomSaltHex() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

export async function hashPassword(password, saltHex = randomSaltHex()) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return { hash: toHex(new Uint8Array(bits)), salt: saltHex };
}

/** Схема старой версии сайта (base64, не хеш) — нужна только для миграции. */
export function legacyHash(password, email) {
  return btoa(encodeURIComponent(`${password}_gw_${email}`));
}

/**
 * Проверяет пароль. Для аккаунта старого формата (без соли) при успехе
 * возвращает upgrade — новый хеш, который нужно сохранить вместо старого.
 */
export async function verifyPassword(user, password) {
  if (!user.salt) {
    if (user.hash !== legacyHash(password, user.email)) return { ok: false, upgrade: null };
    return { ok: true, upgrade: await hashPassword(password) };
  }
  const { hash } = await hashPassword(password, user.salt);
  return { ok: hash === user.hash, upgrade: null };
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateRegistration({ name, email, pass, pass2, agree }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Минимум 2 символа';
  if (!isEmail(email)) errors.email = 'Введите корректный email';
  if (pass.length < 8) errors.pass = 'Минимум 8 символов';
  if (pass !== pass2) errors.pass2 = 'Пароли не совпадают';
  if (!agree) errors.agree = 'Примите условия использования';
  return errors;
}

/** Шестизначный код подтверждения из криптографического генератора. */
export function generateCode() {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  return String(100000 + (value % 900000));
}

export function passwordStrength(password) {
  if (!password) return 0;
  const checks = [
    password.length >= 8,
    password.length >= 12,
    /[A-ZА-ЯЁ]/.test(password),
    /\d/.test(password),
    /[^A-Za-zА-Яа-яЁё0-9]/.test(password),
  ];
  return Math.min(checks.filter(Boolean).length, 4);
}

const isUserRecord = (u) => u !== null && typeof u === 'object' && typeof u.email === 'string';

export function getUsers() {
  const users = readJson(USERS_KEY, []);
  return Array.isArray(users) ? users.filter(isUserRecord) : [];
}

/** Возвращает false, если браузер не дал сохранить данные. */
export function saveUsers(users) {
  return writeJson(USERS_KEY, users);
}

export function findUser(email) {
  return getUsers().find((u) => u.email === email) ?? null;
}

export function upsertUser(user) {
  const users = getUsers().filter((u) => u.email !== user.email);
  return saveUsers([...users, user]);
}
