import { describe, expect, it } from 'vitest';
import {
  filterArtifacts,
  filterCharacters,
  filterWeapons,
  sortCharacters,
} from '../../src/lib/filters.js';

const chars = [
  {
    name: 'Скирк',
    title: 'Звезда пустоты',
    element: 'cryo',
    rarity: 5,
    weapon: 'sword',
    region: 'other',
    version: '5.7',
  },
  {
    name: 'Алёша',
    title: '',
    element: 'electro',
    rarity: 4,
    weapon: 'polearm',
    region: 'snezhnaya',
    version: '7.0',
  },
  {
    name: 'Путешественник',
    title: '',
    element: 'none',
    rarity: 5,
    weapon: 'sword',
    region: 'other',
    version: '1.0',
  },
];
const all = { el: 'all', rarity: 'all', weapon: 'all', region: 'all', q: '' };

describe('filterCharacters', () => {
  it('passes everything with all filters at "all"', () => {
    expect(filterCharacters(chars, all)).toHaveLength(3);
  });

  it('filters by element', () => {
    expect(filterCharacters(chars, { ...all, el: 'cryo' }).map((c) => c.name)).toEqual(['Скирк']);
  });

  it('filters by rarity given as a string', () => {
    expect(filterCharacters(chars, { ...all, rarity: '4' }).map((c) => c.name)).toEqual(['Алёша']);
  });

  it('filters by weapon and region', () => {
    expect(filterCharacters(chars, { ...all, weapon: 'polearm' })).toHaveLength(1);
    expect(filterCharacters(chars, { ...all, region: 'other' })).toHaveLength(2);
  });

  it('searches region and weapon labels and the title', () => {
    expect(filterCharacters(chars, { ...all, q: 'снежная' }).map((c) => c.name)).toEqual(['Алёша']);
    expect(filterCharacters(chars, { ...all, q: 'древковое' }).map((c) => c.name)).toEqual([
      'Алёша',
    ]);
    expect(filterCharacters(chars, { ...all, q: 'пустоты' }).map((c) => c.name)).toEqual(['Скирк']);
  });
});

describe('sortCharacters', () => {
  it('sorts newest first, then by name', () => {
    expect(sortCharacters(chars, 'new').map((c) => c.name)).toEqual([
      'Алёша',
      'Скирк',
      'Путешественник',
    ]);
  });

  it('sorts by Russian name', () => {
    expect(sortCharacters(chars, 'name').map((c) => c.name)).toEqual([
      'Алёша',
      'Путешественник',
      'Скирк',
    ]);
  });

  it('does not mutate the input', () => {
    const copy = [...chars];
    sortCharacters(chars, 'name');
    expect(chars).toEqual(copy);
  });
});

describe('filterWeapons', () => {
  const weapons = [
    {
      name: 'Рассекающий туман',
      type: 'sword',
      rarity: 5,
      passive: { name: 'Лезвие рассекателя тумана' },
    },
    { name: 'Холодное лезвие', type: 'sword', rarity: 3, passive: { name: 'Хладнокровие' } },
    { name: 'Лук Амоса', type: 'bow', rarity: 5, passive: null },
  ];
  const any = { type: 'all', rarity: 'all', q: '' };

  it('filters by type and rarity', () => {
    expect(
      filterWeapons(weapons, { ...any, type: 'sword', rarity: '5' }).map((w) => w.name),
    ).toEqual(['Рассекающий туман']);
  });

  it('searches the name and passive name', () => {
    expect(filterWeapons(weapons, { ...any, q: 'хладно' }).map((w) => w.name)).toEqual([
      'Холодное лезвие',
    ]);
  });
});

describe('filterArtifacts', () => {
  const sets = [
    { name: 'Конец гладиатора', rarity: 5 },
    { name: 'Шаман воды', rarity: 4 },
  ];

  it('filters by rarity and name', () => {
    expect(filterArtifacts(sets, { rarity: '4', q: '' }).map((a) => a.name)).toEqual([
      'Шаман воды',
    ]);
    expect(filterArtifacts(sets, { rarity: 'all', q: 'гладиат' }).map((a) => a.name)).toEqual([
      'Конец гладиатора',
    ]);
  });
});
