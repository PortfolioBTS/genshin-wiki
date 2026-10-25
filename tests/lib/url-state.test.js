import { describe, expect, it } from 'vitest';
import { parseQuery, toQuery } from '../../src/lib/url-state.js';

const schema = {
  el: { default: 'all', values: ['all', 'pyro', 'cryo'] },
  rarity: { default: 'all', values: ['all', '4', '5'] },
  q: { default: '' },
};

describe('parseQuery', () => {
  it('falls back to defaults for unknown values and trims free text', () => {
    expect(parseQuery('?el=foo&rarity=9&q=%20Скирк%20', schema)).toEqual({
      el: 'all',
      rarity: 'all',
      q: 'Скирк',
    });
  });

  it('accepts known values', () => {
    expect(parseQuery('?el=cryo&rarity=5', schema)).toEqual({ el: 'cryo', rarity: '5', q: '' });
  });

  it('caps free text at 50 characters', () => {
    expect(parseQuery('?q=' + 'x'.repeat(80), schema).q).toHaveLength(50);
  });

  it('ignores keys missing from the schema', () => {
    expect(parseQuery('?evil=1', schema)).toEqual({ el: 'all', rarity: 'all', q: '' });
  });
});

describe('toQuery', () => {
  it('omits defaults', () => {
    expect(toQuery({ el: 'cryo', rarity: 'all', q: '' }, schema)).toBe('?el=cryo');
  });

  it('returns an empty string when everything is default', () => {
    expect(toQuery({ el: 'all', rarity: 'all', q: '' }, schema)).toBe('');
  });

  it('keeps schema key order and encodes text', () => {
    expect(toQuery({ q: 'а б', rarity: '5', el: 'pyro' }, schema)).toBe(
      '?el=pyro&rarity=5&q=%D0%B0+%D0%B1',
    );
  });
});
