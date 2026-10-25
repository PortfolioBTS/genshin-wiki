import { describe, expect, it } from 'vitest';
import { resultHref, searchIndex } from '../../src/lib/search.js';

const idx = [
  { type: 'weapon', slug: 'a', name: 'Песнь Алёши' },
  { type: 'character', slug: 'alyosha', name: 'Алёша' },
  { type: 'artifact', slug: 'b', name: 'Малешка' },
  { type: 'weapon', slug: 'c', name: 'Туман' },
];

describe('searchIndex', () => {
  it('ranks name prefix, then word prefix, then substring, ignoring ё and case', () => {
    expect(searchIndex(idx, '  АЛЁШ ').map((i) => i.slug)).toEqual(['alyosha', 'a', 'b']);
  });

  it('keeps the original order inside a rank', () => {
    const twins = [
      { type: 'weapon', slug: 'x', name: 'Лук Амоса' },
      { type: 'weapon', slug: 'y', name: 'Лук ворона' },
    ];
    expect(searchIndex(twins, 'лук').map((i) => i.slug)).toEqual(['x', 'y']);
  });

  it('returns nothing for a blank query', () => {
    expect(searchIndex(idx, '   ')).toEqual([]);
  });

  it('caps results at the limit', () => {
    expect(searchIndex(Array(20).fill(idx[1]), 'а')).toHaveLength(8);
    expect(searchIndex(Array(20).fill(idx[1]), 'а', 3)).toHaveLength(3);
  });
});

describe('resultHref', () => {
  it('opens characters on their page', () => {
    expect(resultHref({ type: 'character', slug: 'skirk', name: 'Скирк' })).toBe(
      'character.html?id=skirk',
    );
  });

  it('opens weapons and artifacts as a filtered catalog', () => {
    expect(resultHref({ type: 'weapon', name: 'Рассекающий туман' })).toBe(
      'weapons.html?q=%D0%A0%D0%B0%D1%81%D1%81%D0%B5%D0%BA%D0%B0%D1%8E%D1%89%D0%B8%D0%B9%20%D1%82%D1%83%D0%BC%D0%B0%D0%BD',
    );
    expect(resultHref({ type: 'artifact', name: 'A&B' })).toBe('artifacts.html?q=A%26B');
  });
});
