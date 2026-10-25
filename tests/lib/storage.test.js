// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readJson, writeJson } from '../../src/lib/storage.js';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('readJson', () => {
  it('returns parsed value', () => {
    localStorage.setItem('k', '{"a":1}');
    expect(readJson('k', null)).toEqual({ a: 1 });
  });

  it('returns fallback for missing key', () => {
    expect(readJson('missing', 'fb')).toBe('fb');
  });

  it('returns fallback for broken JSON', () => {
    localStorage.setItem('k', '{bad json');
    expect(readJson('k', [])).toEqual([]);
  });

  it('returns fallback when storage access throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readJson('k', 'fb')).toBe('fb');
  });
});

describe('writeJson', () => {
  it('stores JSON and reports success', () => {
    expect(writeJson('k', { b: 2 })).toBe(true);
    expect(localStorage.getItem('k')).toBe('{"b":2}');
  });

  it('reports failure when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(writeJson('k', 1)).toBe(false);
  });
});
