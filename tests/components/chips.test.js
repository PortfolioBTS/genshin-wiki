// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  bindChips,
  chipGroupHtml,
  selectFilterHtml,
  syncChips,
} from '../../src/components/chips.js';

const options = [
  { value: 'all', label: 'Все' },
  { value: 'cryo', label: 'Крио' },
];

describe('chip groups', () => {
  it('marks the current option as pressed', () => {
    document.body.innerHTML = chipGroupHtml('el', 'Стихия', options, 'cryo');
    const pressed = [...document.querySelectorAll('[aria-pressed="true"]')].map(
      (b) => b.dataset.value,
    );
    expect(pressed).toEqual(['cryo']);
    expect(document.querySelector('[role="group"]').getAttribute('aria-label')).toBe('Стихия');
  });

  it('reports clicks and syncs pressed state', () => {
    document.body.innerHTML = `<div id="f">${chipGroupHtml('el', 'Стихия', options, 'all')}</div>`;
    const root = document.getElementById('f');
    const onChange = vi.fn();
    bindChips(root, onChange);
    root.querySelector('[data-value="cryo"]').click();
    expect(onChange).toHaveBeenCalledWith('el', 'cryo');
    syncChips(root, { el: 'cryo' });
    expect(root.querySelector('[data-value="cryo"]').getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[data-value="all"]').getAttribute('aria-pressed')).toBe('false');
  });

  it('supports select filters for long option lists', () => {
    document.body.innerHTML = `<div id="f">${selectFilterHtml('region', 'Регион', options, 'cryo')}</div>`;
    const root = document.getElementById('f');
    const select = root.querySelector('select');
    expect(select.value).toBe('cryo');
    const onChange = vi.fn();
    bindChips(root, onChange);
    select.value = 'all';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenCalledWith('region', 'all');
    syncChips(root, { region: 'cryo' });
    expect(select.value).toBe('cryo');
  });

  it('escapes labels', () => {
    expect(chipGroupHtml('x', '<b>', [{ value: 'a', label: '<i>' }], 'a')).not.toMatch(/<b>|<i>/);
  });
});
