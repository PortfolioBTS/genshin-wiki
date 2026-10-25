import { describe, expect, it } from 'vitest';
import { applyPartials, navFor } from '../../build/partials-plugin.js';

const partials = {
  head: '<meta x>',
  header:
    '<nav><a href="index.html" data-nav="index.html">Г</a><a class="n" href="characters.html" data-nav="characters.html">П</a></nav>',
};

describe('applyPartials', () => {
  it('replaces include comments with partial content', () => {
    const out = applyPartials('<head><!-- include:head --></head>', {
      partials,
      page: 'index.html',
    });
    expect(out).toBe('<head><meta x></head>');
  });

  it('marks the nav link of the current page as active', () => {
    const out = applyPartials('<!-- include:header -->', { partials, page: 'index.html' });
    expect(out).toContain(
      '<a href="index.html" data-nav="index.html" class="active" aria-current="page">',
    );
  });

  it('appends active to an existing class and maps character.html to characters.html', () => {
    const out = applyPartials('<!-- include:header -->', { partials, page: 'character.html' });
    expect(out).toContain(
      '<a class="n active" href="characters.html" data-nav="characters.html" aria-current="page">',
    );
    expect(out).not.toMatch(/data-nav="index.html"[^>]*active/);
  });

  it('throws on an unknown partial', () => {
    expect(() => applyPartials('<!-- include:nope -->', { partials, page: 'index.html' })).toThrow(
      'Unknown partial: nope',
    );
  });
});

describe('navFor', () => {
  it('maps the character detail page to the catalog', () => {
    expect(navFor('character.html')).toBe('characters.html');
    expect(navFor('weapons.html')).toBe('weapons.html');
  });
});
