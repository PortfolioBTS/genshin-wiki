import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const INCLUDE = /<!--\s*include:([\w-]+)\s*-->/g;

// Страница персонажа подсвечивает в меню раздел «Персонажи».
const NAV_ALIASES = { 'character.html': 'characters.html' };

export function navFor(page) {
  return NAV_ALIASES[page] ?? page;
}

function markActive(html, nav) {
  const linkRe = new RegExp(`<a\\b[^>]*\\bdata-nav="${nav.replace(/\./g, '\\.')}"[^>]*>`, 'g');
  return html.replace(linkRe, (tag) => {
    const withClass = /\bclass="/.test(tag)
      ? tag.replace(/\bclass="([^"]*)"/, (_, cls) => `class="${cls} active"`)
      : tag.replace(/>$/, ' class="active">');
    return withClass.replace(/>$/, ' aria-current="page">');
  });
}

/** Подставляет partials в HTML и отмечает активный пункт меню. */
export function applyPartials(html, { partials, page }) {
  const withPartials = html.replace(INCLUDE, (_, name) => {
    if (!(name in partials)) throw new Error(`Unknown partial: ${name}`);
    return partials[name];
  });
  return markActive(withPartials, navFor(page));
}

function readPartials(dir) {
  return Object.fromEntries(
    readdirSync(dir)
      .filter((file) => file.endsWith('.html'))
      .map((file) => [basename(file, '.html'), readFileSync(join(dir, file), 'utf8').trim()]),
  );
}

export function partialsPlugin({ dir }) {
  return {
    name: 'genshin-wiki-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // Читаем заново при каждом вызове, чтобы dev-сервер видел правки partials.
        return applyPartials(html, { partials: readPartials(dir), page: basename(ctx.filename) });
      },
    },
  };
}
