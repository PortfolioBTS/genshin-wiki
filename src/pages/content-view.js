import { imageHtml } from '../components/game-image.js';
import { escapeHtml } from '../lib/escape-html.js';
import { ELEMENTS, REGIONS } from '../lib/labels.js';
import { formatDate } from '../lib/text.js';

const characterLink = (c) => `
  <a class="mini-chip el-${c.element}" href="character.html?id=${encodeURIComponent(c.slug)}">
    ${imageHtml({ kind: 'character', file: c.icon, alt: '', fallbackText: c.name, className: `mini-icon el-${c.element}` })}
    <span>${escapeHtml(c.name)}</span>
  </a>`;

const weaponChip = (w) => `
  <span class="mini-chip">
    ${imageHtml({ kind: 'weapon', file: w.icon, alt: '', fallbackText: w.name, className: 'mini-icon' })}
    <span>${escapeHtml(w.name)}</span>
  </span>`;

const subList = (title, items) =>
  items.length
    ? `<div class="sub-list"><h3>${title}</h3><div class="mini-chips">${items.join('')}</div></div>`
    : '';

export function patchCardHtml(patch, { characters, weapons }) {
  const newChars = characters.filter((c) => c.version === patch.version);
  const newWeapons = weapons.filter((w) => w.version === patch.version && w.rarity === 5);
  return `
    <article class="patch-card">
      <header class="patch-header">
        <span class="patch-version">${escapeHtml(patch.version)}</span>
        <h2 class="patch-title">${escapeHtml(patch.title)}</h2>
        <time class="patch-date" datetime="${escapeHtml(patch.date)}">${formatDate(patch.date)}</time>
      </header>
      <ul class="patch-points">${patch.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>
      ${subList('Новые персонажи', newChars.map(characterLink))}
      ${subList('Новое 5★ оружие', newWeapons.map(weaponChip))}
    </article>`;
}

function bannerDates({ start, end }) {
  if (start && end) return `${formatDate(start)} — ${formatDate(end)}`;
  if (start) return `с ${formatDate(start)}`;
  return 'дата уточняется';
}

const BANNER_KINDS = {
  character: 'Молитва события: персонаж',
  weapon: 'Молитва события: оружие',
  chronicled: 'Хроники молитв',
  standard: 'Стандартная молитва',
};

export function bannerCardHtml(banner, { characters, weapons }) {
  const pool = banner.kind === 'weapon' ? weapons : characters;
  const render = banner.kind === 'weapon' ? weaponChip : characterLink;
  const resolve = (slugs) =>
    slugs
      .map((slug) => pool.find((item) => item.slug === slug))
      .filter(Boolean)
      .map(render);
  return `
    <article class="banner-card">
      <p class="b-type">${BANNER_KINDS[banner.kind]}</p>
      <h3>${escapeHtml(banner.title)}</h3>
      ${subList('5★', resolve(banner.featured5))}
      ${subList('4★ с повышенным шансом', resolve(banner.featured4))}
      <p class="banner-dates">🗓 ${bannerDates(banner)}</p>
    </article>`;
}

export function pityHtml(rules) {
  return rules
    .map(
      (r) => `
      <div class="pity-item">
        <div class="p-label">${escapeHtml(r.label)}</div>
        <div class="p-val">${escapeHtml(r.value)}</div>
        <p class="p-sub">${escapeHtml(r.sub)}</p>
      </div>`,
    )
    .join('');
}

export function regionCardHtml(region, characterCount) {
  const element = ELEMENTS[region.element];
  return `
    <article class="region-card el-${region.element}">
      <header class="region-top">
        <span class="region-emoji" aria-hidden="true">${region.emoji}</span>
        <div>
          <h2>${REGIONS[region.slug]}</h2>
          <p class="region-nation">${escapeHtml(region.nation)} · <span class="tag el-${region.element}">${element.icon} ${element.label}</span></p>
        </div>
      </header>
      <div class="region-body">
        <p class="region-archon"><span>Архонт:</span> ${escapeHtml(region.archon)}</p>
        <p>${escapeHtml(region.desc)}</p>
        <div class="r-tags">${region.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        <a class="region-link" href="characters.html?region=${region.slug}">Персонажей: ${characterCount} →</a>
      </div>
    </article>`;
}

export function guideCardHtml(guide, index) {
  return `
    <article class="guide-card">
      <span class="guide-num" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <div>
        <h2>${escapeHtml(guide.title)}</h2>
        <p>${escapeHtml(guide.desc)}</p>
      </div>
      <span class="guide-tag">${escapeHtml(guide.tag)}</span>
    </article>`;
}
