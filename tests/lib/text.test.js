import { describe, expect, it } from 'vitest';
import { matchesQuery, normalize } from '../../src/lib/text.js';

describe('normalize', () => {
  it('lowercases, maps ё to е, trims and collapses spaces', () => {
    expect(normalize('  АЛЁША   Тест ')).toBe('алеша тест');
  });

  it('treats nullish values as an empty string', () => {
    expect(normalize(undefined)).toBe('');
  });
});

describe('matchesQuery', () => {
  it('matches regardless of ё/е and case', () => {
    expect(matchesQuery('алеша', 'Алёша')).toBe(true);
    expect(matchesQuery('АЛЁ', 'алеша')).toBe(true);
  });

  it('matches when any field contains the query', () => {
    expect(matchesQuery('снеж', 'Алёша', 'Снежная')).toBe(true);
    expect(matchesQuery('пиро', 'Алёша', 'Снежная')).toBe(false);
  });

  it('treats an empty query as a match', () => {
    expect(matchesQuery('', 'x')).toBe(true);
    expect(matchesQuery('   ', 'x')).toBe(true);
  });
});
