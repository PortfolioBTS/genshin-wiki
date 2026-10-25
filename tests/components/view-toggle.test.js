// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initViewToggle } from '../../src/components/view-toggle.js';

const MARKUP =
  '<div class="view-toggle"><button data-view="cards">Карточки</button><button data-view="table">Таблица</button></div>';

afterEach(() => localStorage.clear());

describe('initViewToggle', () => {
  it('defaults to cards', () => {
    document.body.innerHTML = MARKUP;
    expect(initViewToggle(document.querySelector('.view-toggle'), 'gw_view_test', () => {})).toBe(
      'cards',
    );
    expect(document.querySelector('[data-view="cards"]').getAttribute('aria-pressed')).toBe('true');
  });

  it('remembers the chosen view', () => {
    document.body.innerHTML = MARKUP;
    const onChange = vi.fn();
    initViewToggle(document.querySelector('.view-toggle'), 'gw_view_test', onChange);
    document.querySelector('[data-view="table"]').click();
    expect(onChange).toHaveBeenCalledWith('table');
    expect(document.querySelector('[data-view="table"]').getAttribute('aria-pressed')).toBe('true');
    document.body.innerHTML = MARKUP;
    expect(initViewToggle(document.querySelector('.view-toggle'), 'gw_view_test', () => {})).toBe(
      'table',
    );
  });

  it('ignores a corrupted stored value', () => {
    localStorage.setItem('gw_view_test', '"grid"');
    document.body.innerHTML = MARKUP;
    expect(initViewToggle(document.querySelector('.view-toggle'), 'gw_view_test', () => {})).toBe(
      'cards',
    );
  });
});
