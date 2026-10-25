import { parseQuery, toQuery } from '../lib/url-state.js';
import { bindChips, syncChips } from './chips.js';
import { initViewToggle } from './view-toggle.js';

const EMPTY = `
  <div class="empty-state">
    <div class="es-icon" aria-hidden="true">🔍</div>
    <p>Ничего не найдено — попробуйте изменить фильтр</p>
  </div>`;

/**
 * Общая логика страниц-каталогов: состояние фильтров в URL, поиск,
 * переключатель «карточки / таблица» и перерисовка результатов.
 * Разметка страницы: .filter-bar, #q, .view-toggle, #result-count, #results.
 */
export function initCatalog({ schema, apply, cardHtml, rowHtml, tableHead, gridClass, viewKey }) {
  const state = parseQuery(location.search, schema);
  const filterBar = document.querySelector('.filter-bar');
  const search = document.getElementById('q');
  const count = document.getElementById('result-count');
  const results = document.getElementById('results');

  let view = initViewToggle(document.querySelector('.view-toggle'), viewKey, (next) => {
    view = next;
    render();
  });

  function render() {
    const list = apply(state);
    count.textContent = `Найдено: ${list.length}`;
    if (!list.length) {
      results.innerHTML = EMPTY;
    } else if (view === 'table') {
      const head = tableHead.map((title) => `<th scope="col">${title}</th>`).join('');
      results.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${list.map(rowHtml).join('')}</tbody></table></div>`;
    } else {
      results.innerHTML = `<div class="${gridClass}">${list.map(cardHtml).join('')}</div>`;
    }
  }

  function update(name, value) {
    state[name] = value;
    history.replaceState(null, '', toQuery(state, schema) || location.pathname);
    syncChips(filterBar, state);
    render();
  }

  bindChips(filterBar, update);
  syncChips(filterBar, state);
  search.value = state.q;
  search.addEventListener('input', () => update('q', search.value.slice(0, 50)));
  render();
}

// Вспомогательные построители вариантов фильтров для страниц-каталогов.

export const allOption = (label = 'Все') => ({ value: 'all', label });

export const rarityOptions = (rarities) => [
  allOption(),
  ...rarities.map((r) => ({ value: String(r), label: `${r}★` })),
];

export const schemaValues = (options) => options.map((o) => o.value);
