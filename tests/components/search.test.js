// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initSearch } from '../../src/components/search.js';

const idx = [
  { type: 'character', slug: 'alyosha', name: 'Алёша', icon: 'I' },
  { type: 'weapon', slug: 'a', name: 'Песнь Алёши', icon: 'W' },
  { type: 'artifact', slug: 'b', name: 'Малешка', icon: 'A' },
];

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let input;
let list;
let navigate;

async function type(value) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await flush();
}

const key = (k) => input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

beforeEach(() => {
  document.body.innerHTML =
    '<div class="site-search"><input id="s"><ul id="r" hidden></ul></div><p id="outside">x</p>';
  input = document.getElementById('s');
  list = document.getElementById('r');
  navigate = vi.fn();
  initSearch(input, list, async () => ({ default: idx }), navigate);
});

describe('initSearch', () => {
  it('shows grouped results with type labels', async () => {
    await type('ал');
    const options = list.querySelectorAll('[role="option"]');
    expect(list.hidden).toBe(false);
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toContain('Персонаж');
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('moves selection with arrows and opens it with Enter', async () => {
    await type('ал');
    key('ArrowDown');
    key('ArrowDown');
    const options = list.querySelectorAll('[role="option"]');
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);
    key('Enter');
    expect(navigate).toHaveBeenCalledWith(
      'weapons.html?q=%D0%9F%D0%B5%D1%81%D0%BD%D1%8C%20%D0%90%D0%BB%D1%91%D1%88%D0%B8',
    );
  });

  it('opens the first result on Enter without a selection', async () => {
    await type('алеша');
    key('Enter');
    expect(navigate).toHaveBeenCalledWith('character.html?id=alyosha');
  });

  it('shows an empty message for no matches', async () => {
    await type('zzz');
    expect(list.textContent).toContain('Ничего не найдено');
  });

  it('closes on Escape, on blank input and on outside click', async () => {
    await type('ал');
    key('Escape');
    expect(list.hidden).toBe(true);
    await type('ал');
    await type('  ');
    expect(list.hidden).toBe(true);
    await type('ал');
    document.getElementById('outside').click();
    expect(list.hidden).toBe(true);
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens a result on click', async () => {
    await type('мал');
    list.querySelector('[role="option"]').click();
    expect(navigate).toHaveBeenCalledWith(
      'artifacts.html?q=%D0%9C%D0%B0%D0%BB%D0%B5%D1%88%D0%BA%D0%B0',
    );
  });
});
