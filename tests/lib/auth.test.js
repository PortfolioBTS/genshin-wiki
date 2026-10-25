// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  PBKDF2_ITERATIONS,
  findUser,
  generateCode,
  getUsers,
  hashPassword,
  isEmail,
  legacyHash,
  passwordStrength,
  saveUsers,
  upsertUser,
  validateRegistration,
  verifyPassword,
} from '../../src/lib/auth.js';

afterEach(() => localStorage.clear());

const SALT = '00'.repeat(16);

describe('hashPassword', () => {
  it('uses 600 000 PBKDF2 iterations', () => {
    expect(PBKDF2_ITERATIONS).toBe(600000);
  });

  it('is deterministic for a fixed salt and returns hex', async () => {
    const { hash, salt } = await hashPassword('secret123', SALT);
    expect(salt).toBe(SALT);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect((await hashPassword('secret123', SALT)).hash).toBe(hash);
    expect((await hashPassword('secret124', SALT)).hash).not.toBe(hash);
  });

  it('generates a random 16-byte salt by default', async () => {
    const a = await hashPassword('secret123');
    const b = await hashPassword('secret123');
    expect(a.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe('verifyPassword', () => {
  it('accepts the right password and rejects a wrong one', async () => {
    const { hash, salt } = await hashPassword('secret123', SALT);
    const user = { email: 'a@b.c', hash, salt };
    expect(await verifyPassword(user, 'secret123')).toEqual({ ok: true, upgrade: null });
    expect((await verifyPassword(user, 'wrong')).ok).toBe(false);
  });

  it('accepts a legacy base64 account and returns an upgraded hash', async () => {
    const legacy = { email: 'a@b.c', hash: legacyHash('oldpass1', 'a@b.c') };
    expect(legacy.hash).toBe(btoa(encodeURIComponent('oldpass1_gw_a@b.c')));
    const result = await verifyPassword(legacy, 'oldpass1');
    expect(result.ok).toBe(true);
    expect(result.upgrade.salt).toMatch(/^[0-9a-f]{32}$/);
    const upgraded = { ...legacy, ...result.upgrade };
    expect((await verifyPassword(upgraded, 'oldpass1')).ok).toBe(true);
  });

  it('rejects a wrong password for a legacy account without an upgrade', async () => {
    const legacy = { email: 'a@b.c', hash: legacyHash('oldpass1', 'a@b.c') };
    expect(await verifyPassword(legacy, 'nope')).toEqual({ ok: false, upgrade: null });
  });
});

describe('validation', () => {
  it('reports every invalid field with the site messages', () => {
    expect(
      validateRegistration({ name: 'А', email: 'x', pass: '1', pass2: '2', agree: false }),
    ).toEqual({
      name: 'Минимум 2 символа',
      email: 'Введите корректный email',
      pass: 'Минимум 8 символов',
      pass2: 'Пароли не совпадают',
      agree: 'Примите условия использования',
    });
  });

  it('returns no errors for valid input', () => {
    expect(
      validateRegistration({
        name: 'Аня',
        email: 'a@b.c',
        pass: 'secret123',
        pass2: 'secret123',
        agree: true,
      }),
    ).toEqual({});
  });

  it('checks email format', () => {
    expect(isEmail('a@b.c')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('a b@c.d')).toBe(false);
  });
});

describe('generateCode', () => {
  it('returns six digits without a leading zero', () => {
    for (let i = 0; i < 50; i++) expect(generateCode()).toMatch(/^[1-9]\d{5}$/);
  });
});

describe('passwordStrength', () => {
  it('scores length, case, digits and symbols up to 4', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abcdefgh')).toBe(1);
    expect(passwordStrength('Abcdefgh1')).toBe(3);
    expect(passwordStrength('Abcdefgh1234!')).toBe(4);
  });
});

describe('user store', () => {
  it('returns an empty list for corrupted or non-array storage', () => {
    localStorage.setItem('gw_users', '{oops');
    expect(getUsers()).toEqual([]);
    localStorage.setItem('gw_users', '{"a":1}');
    expect(getUsers()).toEqual([]);
  });

  it('inserts and updates users by email', () => {
    upsertUser({ email: 'a@b.c', name: 'A', hash: 'h1' });
    upsertUser({ email: 'x@y.z', name: 'X', hash: 'h2' });
    upsertUser({ email: 'a@b.c', name: 'A', hash: 'h3', salt: 's' });
    expect(getUsers()).toHaveLength(2);
    expect(findUser('a@b.c')).toMatchObject({ hash: 'h3', salt: 's' });
    expect(findUser('none@b.c')).toBeNull();
    saveUsers([]);
    expect(getUsers()).toEqual([]);
  });
});
