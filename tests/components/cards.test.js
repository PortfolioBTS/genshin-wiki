import { describe, expect, it } from 'vitest';
import {
  artifactCardHtml,
  artifactRowHtml,
  characterCardHtml,
  characterRowHtml,
  weaponCardHtml,
  weaponRowHtml,
} from '../../src/components/cards.js';

const skirk = {
  slug: 'skirk',
  name: '<Скирк>',
  title: 'Звезда пустоты',
  rarity: 5,
  element: 'cryo',
  weapon: 'sword',
  region: 'other',
  version: '5.7',
  icon: 'I',
};

const mistsplitter = {
  slug: 'mistsplitter-reforged',
  name: 'Рассекающий туман',
  type: 'sword',
  rarity: 5,
  baseAtk: 674,
  substat: { label: 'Крит. урон', value: '44,1%' },
  passive: { name: 'Лезвие', html: 'Урон <b class="hl">12%</b>' },
  icon: 'W',
};

const bare = {
  slug: 'w',
  name: 'W',
  type: 'sword',
  rarity: 3,
  baseAtk: 401,
  substat: null,
  passive: null,
  icon: 'I',
};

const shaman = {
  slug: 's',
  name: 'Шаман воды',
  rarity: 4,
  bonus1: 'Эффект',
  bonus2: null,
  bonus4: null,
  icon: 'I',
};

const gladiator = {
  slug: 'g',
  name: 'Конец гладиатора',
  rarity: 5,
  bonus1: null,
  bonus2: 'Сила атаки +18%.',
  bonus4: 'Урон обычной атаки +35%.',
  icon: 'I',
};

describe('character cards', () => {
  it('links to the character page and escapes the name', () => {
    const html = characterCardHtml(skirk);
    expect(html).toContain('href="character.html?id=skirk"');
    expect(html).toContain('&lt;Скирк&gt;');
    expect(html).not.toContain('<Скирк>');
  });

  it('shows rarity, element, weapon and region labels', () => {
    const html = characterCardHtml(skirk);
    expect(html).toContain('★★★★★');
    expect(html).toContain('Крио');
    expect(html).toContain('Одноручный меч');
    expect(html).toContain('el-cryo');
  });

  it('renders a table row with the same link', () => {
    const html = characterRowHtml(skirk);
    expect(html).toMatch(/^<tr>/);
    expect(html).toContain('href="character.html?id=skirk"');
    expect(html).toContain('5.7');
  });
});

describe('weapon cards', () => {
  it('shows base attack, substat and trusted passive HTML', () => {
    const html = weaponCardHtml(mistsplitter);
    expect(html).toContain('674');
    expect(html).toContain('44,1%');
    expect(html).toContain('<b class="hl">12%</b>');
  });

  it('omits missing substat and passive without printing null', () => {
    expect(weaponCardHtml(bare)).not.toMatch(/undefined|null/);
    expect(weaponRowHtml(bare)).not.toMatch(/undefined|null/);
  });
});

describe('artifact cards', () => {
  it('labels only the bonuses that exist', () => {
    const html = artifactCardHtml(shaman);
    expect(html).toContain('1 предмет');
    expect(html).not.toMatch(/undefined|null|2 предмета/);
  });

  it('lists 2 and 4 piece bonuses', () => {
    const html = artifactCardHtml(gladiator);
    expect(html).toContain('2 предмета');
    expect(html).toContain('4 предмета');
    expect(html).not.toContain('1 предмет:');
  });

  it('renders a table row', () => {
    expect(artifactRowHtml(gladiator)).toMatch(/^<tr>/);
    expect(artifactRowHtml(shaman)).not.toMatch(/undefined|null/);
  });
});
