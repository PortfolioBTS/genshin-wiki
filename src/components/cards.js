import { escapeHtml } from '../lib/escape-html.js';
import { ELEMENTS, REGIONS, WEAPON_TYPES } from '../lib/labels.js';
import { imageHtml } from './game-image.js';

export const stars = (rarity) =>
  `<span class="stars" aria-label="${rarity} ★">${'★'.repeat(rarity)}</span>`;

const characterHref = (slug) => `character.html?id=${encodeURIComponent(slug)}`;

const elementTag = (element) =>
  `<span class="tag el-${element}">${ELEMENTS[element].icon} ${ELEMENTS[element].label}</span>`;

export function characterCardHtml(c) {
  return `
    <a class="card char-card rarity-${c.rarity} el-${c.element}" href="${characterHref(c.slug)}">
      <div class="card-top">
        <span class="card-element" aria-hidden="true">${ELEMENTS[c.element].icon}</span>
        <span class="card-rarity">${stars(c.rarity)}</span>
        ${imageHtml({ kind: 'character', file: c.icon, alt: '', fallbackText: c.name, className: `el-${c.element}` })}
      </div>
      <div class="card-body">
        <div class="card-name">${escapeHtml(c.name)}</div>
        <div class="card-meta">${escapeHtml(c.title || REGIONS[c.region])}</div>
        <div class="card-tags">
          ${elementTag(c.element)}
          <span class="tag">${WEAPON_TYPES[c.weapon]}</span>
          <span class="tag">${REGIONS[c.region]}</span>
        </div>
      </div>
    </a>`;
}

export function characterRowHtml(c) {
  return `<tr>
    <td><a href="${characterHref(c.slug)}">${imageHtml({ kind: 'character', file: c.icon, alt: '', fallbackText: c.name, className: `row-icon el-${c.element}` })}${escapeHtml(c.name)}</a></td>
    <td>${stars(c.rarity)}</td>
    <td>${elementTag(c.element)}</td>
    <td>${WEAPON_TYPES[c.weapon]}</td>
    <td>${REGIONS[c.region]}</td>
    <td>${escapeHtml(c.version)}</td>
  </tr>`;
}

const itemHead = (kind, item, sub) => `
  <div class="item-head">
    ${imageHtml({ kind, file: item.icon, alt: '', fallbackText: item.name, className: 'item-icon' })}
    <div>
      <h3>${escapeHtml(item.name)}</h3>
      <div class="item-sub">${stars(item.rarity)}${sub ? ` · ${sub}` : ''}</div>
    </div>
  </div>`;

const stat = (label, value) =>
  `<div class="stat"><div class="stat-label">${escapeHtml(label)}</div><div class="stat-value">${escapeHtml(value)}</div></div>`;

export function weaponCardHtml(w) {
  return `
    <article class="card item-card rarity-${w.rarity}">
      ${itemHead('weapon', w, WEAPON_TYPES[w.type])}
      <div class="stat-grid">
        ${stat('Базовая атака (ур. 90)', w.baseAtk)}
        ${w.substat ? stat(w.substat.label, w.substat.value) : ''}
      </div>
      ${w.passive ? `<div class="item-text"><strong>${escapeHtml(w.passive.name)}</strong>${w.passive.html}</div>` : ''}
    </article>`;
}

export function weaponRowHtml(w) {
  return `<tr>
    <td><span class="row-name">${imageHtml({ kind: 'weapon', file: w.icon, alt: '', fallbackText: w.name, className: 'row-icon' })}${escapeHtml(w.name)}</span></td>
    <td>${WEAPON_TYPES[w.type]}</td>
    <td>${stars(w.rarity)}</td>
    <td>${w.baseAtk}</td>
    <td>${w.substat ? `${escapeHtml(w.substat.label)}: ${escapeHtml(w.substat.value)}` : '—'}</td>
    <td class="cell-text">${w.passive ? `<strong>${escapeHtml(w.passive.name)}.</strong> ${w.passive.html}` : '—'}</td>
  </tr>`;
}

const BONUS_LABELS = [
  ['bonus1', '1 предмет'],
  ['bonus2', '2 предмета'],
  ['bonus4', '4 предмета'],
];

const bonusItems = (a) =>
  BONUS_LABELS.filter(([key]) => a[key])
    .map(([key, label]) => `<li><b>${label}:</b> ${a[key]}</li>`)
    .join('');

export function artifactCardHtml(a) {
  return `
    <article class="card item-card rarity-${a.rarity}">
      ${itemHead('artifact', a, '')}
      <ul class="bonus-list">${bonusItems(a)}</ul>
    </article>`;
}

export function artifactRowHtml(a) {
  return `<tr>
    <td><span class="row-name">${imageHtml({ kind: 'artifact', file: a.icon, alt: '', fallbackText: a.name, className: 'row-icon' })}${escapeHtml(a.name)}</span></td>
    <td>${stars(a.rarity)}</td>
    <td class="cell-text"><ul class="bonus-list">${bonusItems(a)}</ul></td>
  </tr>`;
}
