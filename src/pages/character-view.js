import { stars } from '../components/cards.js';
import { imageHtml } from '../components/game-image.js';
import { escapeHtml } from '../lib/escape-html.js';
import { ELEMENTS, REGIONS, WEAPON_TYPES } from '../lib/labels.js';

const SLUG = /^[a-z0-9-]+$/;

export function findCharacter(list, id) {
  if (typeof id !== 'string' || !SLUG.test(id)) return null;
  return list.find((c) => c.slug === id) ?? null;
}

const KIND_LABELS = { combat: 'Боевой талант', passive: 'Пассивный талант' };

function factsHtml(summary, detail) {
  const facts = [
    ['Регион', REGIONS[summary.region]],
    ['Принадлежность', detail.affiliation],
    ['День рождения', summary.birthday],
    ['Созвездие', summary.constellation],
    ['Стат возвышения', detail.ascensionStat],
    ['Появление', summary.version && `версия ${summary.version}`],
  ].filter(([, value]) => value);
  return facts
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('');
}

function talentsHtml(summary, talents) {
  if (!talents.length) {
    return summary.slug === 'traveler'
      ? '<section class="char-section"><h2>Таланты</h2><p class="muted">Таланты зависят от выбранной стихии: Путешественник получает новый набор умений у Статуи Семи каждой нации.</p></section>'
      : '';
  }
  const tabs = talents
    .map(
      (t, i) =>
        `<button type="button" role="tab" id="talent-tab-${i}" aria-controls="talent-panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${escapeHtml(t.name)}</button>`,
    )
    .join('');
  const panels = talents
    .map(
      (t, i) => `
      <div role="tabpanel" id="talent-panel-${i}" aria-labelledby="talent-tab-${i}" tabindex="0"${i === 0 ? '' : ' hidden'}>
        <p class="talent-kind">${KIND_LABELS[t.kind]}</p>
        <h3>${escapeHtml(t.name)}</h3>
        <p>${t.html}</p>
      </div>`,
    )
    .join('');
  return `
    <section class="char-section">
      <h2>Таланты</h2>
      <div class="tabs" role="tablist" aria-label="Таланты">${tabs}</div>
      <div class="tab-panels">${panels}</div>
    </section>`;
}

function constellationsHtml(list) {
  if (!list.length) return '';
  const items = list
    .map(
      (c) => `
      <li>
        <span class="cons-level">C${c.level}</span>
        <div><h3>${escapeHtml(c.name)}</h3><p>${c.html}</p></div>
      </li>`,
    )
    .join('');
  return `<section class="char-section"><h2>Созвездия</h2><ol class="cons-list">${items}</ol></section>`;
}

function materialsHtml(list) {
  if (!list.length) return '';
  const rows = list
    .map(
      (m) =>
        `<tr><td>${escapeHtml(m.name)}</td><td class="num">${m.count.toLocaleString('ru-RU')}</td></tr>`,
    )
    .join('');
  return `
    <section class="char-section">
      <h2>Материалы возвышения</h2>
      <p class="muted">Сумма за все шесть фаз возвышения персонажа.</p>
      <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Материал</th><th scope="col">Количество</th></tr></thead><tbody>${rows}</tbody></table></div>
    </section>`;
}

export function renderCharacter(summary, detail) {
  const element = ELEMENTS[summary.element];
  return `
    <article class="char-page el-${summary.element} rarity-${summary.rarity}">
      <a class="back-link" href="characters.html">← Все персонажи</a>
      <header class="char-hero">
        <div class="char-portrait">
          ${imageHtml({ kind: 'character', file: summary.icon, alt: summary.name, fallbackText: summary.name, className: `char-icon el-${summary.element}` })}
        </div>
        <div class="char-info">
          ${summary.title ? `<p class="char-title">${escapeHtml(summary.title)}</p>` : ''}
          <h1>${escapeHtml(summary.name)}</h1>
          <div class="char-tags">
            ${stars(summary.rarity)}
            <span class="tag el-${summary.element}">${element.icon} ${element.label}</span>
            <span class="tag">${WEAPON_TYPES[summary.weapon]}</span>
          </div>
          <dl class="char-facts">${factsHtml(summary, detail)}</dl>
        </div>
        <div class="char-splash-wrap" aria-hidden="true">
          ${imageHtml({ kind: 'splash', file: detail.splash, alt: '', fallbackText: summary.name, className: 'char-splash' })}
        </div>
      </header>
      ${detail.description ? `<section class="char-section"><h2>Описание</h2><p class="char-desc">${escapeHtml(detail.description)}</p></section>` : ''}
      ${talentsHtml(summary, detail.talents)}
      ${constellationsHtml(detail.constellations)}
      ${materialsHtml(detail.materials)}
    </article>`;
}

export function renderNotFound() {
  return `
    <div class="empty-state">
      <div class="es-icon" aria-hidden="true">🧭</div>
      <h1>Персонаж не найден</h1>
      <p>Проверьте ссылку или выберите героя в <a href="characters.html">каталоге персонажей</a>.</p>
    </div>`;
}

function selectTab(tabs, index) {
  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
}

/** Вкладки талантов: клик и стрелки ←/→ по шаблону ARIA tabs. */
export function initTabs(root) {
  const list = root.querySelector('[role="tablist"]');
  if (!list) return;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  list.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) selectTab(tabs, tabs.indexOf(tab));
  });
  list.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const current = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const next = (current + step + tabs.length) % tabs.length;
    selectTab(tabs, next);
    tabs[next].focus();
    event.preventDefault();
  });
}
