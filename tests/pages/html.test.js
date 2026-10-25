// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const parse = (file) =>
  new DOMParser().parseFromString(readFileSync(join(process.cwd(), file), 'utf8'), 'text/html');

describe('static page markup', () => {
  it('auth.html hides every panel except login before the script runs', () => {
    const doc = parse('auth.html');
    const panels = [...doc.querySelectorAll('[data-panel]')];
    expect(panels.length).toBe(8);
    for (const panel of panels) {
      expect(panel.hasAttribute('hidden')).toBe(panel.dataset.panel !== 'login');
    }
  });

  it('character.html does not announce the whole page as a live region', () => {
    expect(parse('character.html').getElementById('character').hasAttribute('aria-live')).toBe(
      false,
    );
  });
});
