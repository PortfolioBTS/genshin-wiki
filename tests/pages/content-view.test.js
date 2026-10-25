import { describe, expect, it } from 'vitest';
import {
  bannerCardHtml,
  guideCardHtml,
  patchCardHtml,
  pityHtml,
  regionCardHtml,
} from '../../src/pages/content-view.js';

const characters = [
  { slug: 'vesna', name: 'Весна', rarity: 5, element: 'anemo', version: '7.1', icon: 'V' },
  { slug: 'skirk', name: 'Скирк', rarity: 5, element: 'cryo', version: '5.7', icon: 'S' },
  { slug: 'dahlia', name: 'Далия', rarity: 4, element: 'hydro', version: '5.7', icon: 'D' },
];
const weapons = [
  { slug: 'azurelight', name: 'Лазурное сияние', rarity: 5, version: '5.7', icon: 'A' },
  { slug: 'ode', name: 'Ода водоворота', rarity: 5, version: '7.1', icon: 'O' },
  { slug: 'four', name: 'Четвёрка', rarity: 4, version: '7.1', icon: 'F' },
];
const data = { characters, weapons };

describe('patchCardHtml', () => {
  const patch = {
    version: '7.1',
    date: '2026-09-23',
    title: 'A Rekviem',
    highlights: ['<b>Важно</b>'],
  };

  it('shows date, escaped highlights and new characters with links', () => {
    const html = patchCardHtml(patch, data);
    expect(html).toContain('23.09.2026');
    expect(html).toContain('&lt;b&gt;Важно&lt;/b&gt;');
    expect(html).toContain('href="character.html?id=vesna"');
    expect(html).not.toContain('skirk');
  });

  it('lists only new 5-star weapons', () => {
    const html = patchCardHtml(patch, data);
    expect(html).toContain('Ода водоворота');
    expect(html).not.toContain('Четвёрка');
  });

  it('omits empty sub-lists', () => {
    const html = patchCardHtml({ ...patch, version: '6.9' }, data);
    expect(html).not.toContain('Новые персонажи');
    expect(html).not.toContain('Новое 5★ оружие');
  });
});

describe('bannerCardHtml', () => {
  it('links featured characters and formats the window', () => {
    const html = bannerCardHtml(
      {
        title: 'Скирк',
        kind: 'character',
        featured5: ['skirk'],
        featured4: ['dahlia'],
        start: '2026-10-13',
        end: '2026-11-03',
      },
      data,
    );
    expect(html).toContain('href="character.html?id=skirk"');
    expect(html).toContain('Далия');
    expect(html).toContain('13.10.2026 — 03.11.2026');
  });

  it('resolves weapon slugs for weapon banners', () => {
    const html = bannerCardHtml(
      {
        title: 'Оружие',
        kind: 'weapon',
        featured5: ['azurelight'],
        featured4: [],
        start: null,
        end: null,
      },
      data,
    );
    expect(html).toContain('Лазурное сияние');
    expect(html).toContain('дата уточняется');
  });

  it('shows a start date without an end date', () => {
    const html = bannerCardHtml(
      {
        title: '7.2',
        kind: 'character',
        featured5: [],
        featured4: [],
        start: '2026-11-04',
        end: null,
      },
      data,
    );
    expect(html).toContain('с 04.11.2026');
  });
});

describe('regionCardHtml', () => {
  it('links to the filtered catalog with a character count', () => {
    const html = regionCardHtml(
      {
        slug: 'snezhnaya',
        emoji: '❄️',
        nation: 'Нация льда',
        element: 'cryo',
        archon: 'Царица',
        desc: 'Север',
        tags: ['Фатуи'],
      },
      7,
    );
    expect(html).toContain('Снежная');
    expect(html).toContain('href="characters.html?region=snezhnaya"');
    expect(html).toContain('Персонажей: 7');
    expect(html).toContain('Крио');
  });
});

describe('guideCardHtml', () => {
  it('numbers guides and escapes text', () => {
    const html = guideCardHtml({ title: '<x>', tag: 'Новичок', desc: 'd' }, 0);
    expect(html).toContain('01');
    expect(html).toContain('&lt;x&gt;');
  });
});

describe('pityHtml', () => {
  it('renders every rule', () => {
    const html = pityHtml([{ label: 'Гарантия', value: '90', sub: 's' }]);
    expect(html).toContain('Гарантия');
    expect(html).toContain('90');
  });
});
