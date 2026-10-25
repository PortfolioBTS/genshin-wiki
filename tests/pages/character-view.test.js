// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  findCharacter,
  initTabs,
  renderCharacter,
  renderNotFound,
} from '../../src/pages/character-view.js';

const summary = {
  slug: 'skirk',
  name: 'Скирк',
  title: 'Звезда пустоты',
  rarity: 5,
  element: 'cryo',
  weapon: 'sword',
  region: 'other',
  birthday: '5 ноября',
  constellation: 'Кристаллина',
  version: '5.7',
  icon: 'UI_AvatarIcon_SkirkNew',
};

const detail = {
  slug: 'skirk',
  description: 'Путница <из> Бездны.',
  affiliation: 'Космический катаклизм',
  ascensionStat: 'Крит. урон',
  splash: 'UI_Gacha_AvatarImg_SkirkNew',
  talents: [
    { kind: 'combat', name: 'Удар', html: '<b class="hl">x</b>' },
    { kind: 'passive', name: 'Пассивка', html: 'y' },
  ],
  constellations: [{ level: 1, name: 'Первое', html: 'z' }],
  materials: [{ name: 'Мора', count: 2092530 }],
};

describe('findCharacter', () => {
  const list = [{ slug: 'skirk', name: 'Скирк' }];

  it('finds a character by slug', () => {
    expect(findCharacter(list, 'skirk').name).toBe('Скирк');
  });

  it('rejects malformed, empty and unknown ids', () => {
    expect(findCharacter(list, '../../x')).toBeNull();
    expect(findCharacter(list, '')).toBeNull();
    expect(findCharacter(list, null)).toBeNull();
    expect(findCharacter(list, 'nobody')).toBeNull();
    expect(findCharacter(list, 'SKIRK')).toBeNull();
  });
});

describe('renderCharacter', () => {
  it('renders facts, escaped description and trusted talent HTML', () => {
    const html = renderCharacter(summary, detail);
    expect(html).toContain('<h1');
    expect(html).toContain('Скирк');
    expect(html).toContain('Путница &lt;из&gt; Бездны.');
    expect(html).toContain('<b class="hl">x</b>');
    expect(html).toContain('Кристаллина');
    expect(html).toContain('5 ноября');
    expect(html).toContain('role="tab"');
    expect(html).toContain('C1');
  });

  it('formats material counts with Russian grouping', () => {
    expect(renderCharacter(summary, detail)).toMatch(/2\s092\s530/);
  });

  it('omits empty sections', () => {
    const html = renderCharacter(summary, { ...detail, constellations: [], materials: [] });
    expect(html).not.toContain('Созвездия');
    expect(html).not.toContain('Материалы');
  });

  it('explains Traveler talents instead of showing tabs', () => {
    const html = renderCharacter(
      { ...summary, slug: 'traveler', name: 'Путешественник', element: 'none' },
      { ...detail, talents: [], constellations: [], materials: [] },
    );
    expect(html).toContain('Таланты зависят от выбранной стихии');
    expect(html).not.toContain('role="tab"');
  });
});

describe('renderNotFound', () => {
  it('links back to the catalog', () => {
    expect(renderNotFound()).toContain('href="characters.html"');
    expect(renderNotFound()).toContain('Персонаж не найден');
  });
});

describe('initTabs', () => {
  it('switches panels on click and with arrow keys', () => {
    document.body.innerHTML = `<div id="root">${renderCharacter(summary, detail)}</div>`;
    const root = document.getElementById('root');
    initTabs(root);
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = [...root.querySelectorAll('[role="tabpanel"]')];
    expect(panels.map((p) => p.hidden)).toEqual([false, true]);

    tabs[1].click();
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(panels.map((p) => p.hidden)).toEqual([true, false]);

    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[0]);
  });
});
