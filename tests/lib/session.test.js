// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { clearCurrentUser, getCurrentUser, setCurrentUser } from '../../src/lib/session.js';

afterEach(() => localStorage.clear());

describe('session', () => {
  it('returns null when nobody is logged in', () => {
    expect(getCurrentUser()).toBeNull();
  });

  it('rejects a stored user with a malformed shape', () => {
    localStorage.setItem('gw_user', JSON.stringify({ name: 5 }));
    expect(getCurrentUser()).toBeNull();
  });

  it('stores, reads and clears the current user under gw_user', () => {
    setCurrentUser({ name: 'Аня', email: 'a@b.c', joined: '01.01.2026' });
    expect(JSON.parse(localStorage.getItem('gw_user')).email).toBe('a@b.c');
    expect(getCurrentUser()).toEqual({ name: 'Аня', email: 'a@b.c', joined: '01.01.2026' });
    clearCurrentUser();
    expect(getCurrentUser()).toBeNull();
  });
});
