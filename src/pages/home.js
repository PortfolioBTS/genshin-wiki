import '../styles/main.css';
import '../styles/pages/home.css';
import { imageHtml } from '../components/game-image.js';
import { initLayout } from '../components/layout.js';
import { PATCHES } from '../data/content/patches.js';
import { REGIONS_INFO } from '../data/content/regions.js';
import characters from '../data/generated/characters.json';
import meta from '../data/generated/meta.json';
import { escapeHtml } from '../lib/escape-html.js';
import { ELEMENTS } from '../lib/labels.js';
import { formatDate } from '../lib/text.js';

const PLAYABLE_ELEMENTS = Object.entries(ELEMENTS).filter(([key]) => key !== 'none');

function renderStats() {
  const stats = [
    [meta.counts.characters, 'Персонажей'],
    [PLAYABLE_ELEMENTS.length, 'Стихий'],
    [REGIONS_INFO.length, 'Регионов'],
    [meta.counts.weapons, 'Видов оружия'],
    [meta.counts.artifacts, 'Сетов артефактов'],
  ];
  document.getElementById('hero-stats').innerHTML = stats
    .map(([value, label]) => `<div class="hero-stat"><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('');
}

function renderNews() {
  const patch = PATCHES[0];
  document.getElementById('news').innerHTML = `
    <span class="news-badge">Версия ${escapeHtml(patch.version)}</span>
    <div>
      <p class="news-title">«${escapeHtml(patch.title)}» · ${formatDate(patch.date)}</p>
      <p>${patch.highlights.slice(0, 2).map(escapeHtml).join(' ')}</p>
    </div>
    <a class="news-link" href="patches.html">Все патчноуты →</a>`;
}

function renderNewCharacters() {
  const fresh = characters.filter((c) => c.version === meta.latestVersion);
  const section = document.getElementById('new-in-version');
  if (!fresh.length) {
    section.remove();
    return;
  }
  section.innerHTML = `
    <h2 class="sections-title" id="new-title">Новое в версии ${escapeHtml(meta.latestVersion)}</h2>
    <div class="new-chars">
      ${fresh
        .map(
          (c) => `
        <a class="new-char el-${c.element}" href="character.html?id=${encodeURIComponent(c.slug)}">
          ${imageHtml({ kind: 'character', file: c.icon, alt: '', fallbackText: c.name, className: `new-char-img el-${c.element}` })}
          <span>
            <strong>${escapeHtml(c.name)}</strong>
            <small>${'★'.repeat(c.rarity)} · ${ELEMENTS[c.element].label}</small>
          </span>
        </a>`,
        )
        .join('')}
    </div>`;
}

function renderElements() {
  document.getElementById('elem-list').innerHTML = PLAYABLE_ELEMENTS.map(
    ([key, { label, icon }]) =>
      `<a class="elem-chip el-${key}" href="characters.html?el=${key}"><span aria-hidden="true">${icon}</span> ${label}</a>`,
  ).join('');
}

initLayout();
renderStats();
renderNews();
renderNewCharacters();
renderElements();
