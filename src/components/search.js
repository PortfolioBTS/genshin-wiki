import { escapeHtml } from '../lib/escape-html.js';
import { normalize } from '../lib/text.js';
import { resultHref, searchIndex } from '../lib/search.js';
import { imageHtml } from './game-image.js';

const TYPE_LABELS = { character: 'Персонаж', weapon: 'Оружие', artifact: 'Артефакт' };

const loadIndex = () => import('../data/generated/search-index.json');

/** Поиск в шапке по шаблону ARIA combobox; индекс грузится при первом фокусе. */
export function initSearch(
  input,
  listEl,
  load = loadIndex,
  navigate = (href) => location.assign(href),
) {
  let index = null;
  let indexPromise = null;
  let results = [];
  let active = -1;

  const ensureIndex = () => {
    indexPromise ??= load().then((mod) => {
      index = mod.default ?? mod;
    });
    return indexPromise;
  };

  function close() {
    listEl.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }

  function setActive(next) {
    const options = listEl.querySelectorAll('[role="option"]');
    if (!options.length) return;
    active = (next + options.length) % options.length;
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', options[active].id);
    options[active].scrollIntoView?.({ block: 'nearest' });
  }

  function render() {
    active = -1;
    input.removeAttribute('aria-activedescendant');
    listEl.innerHTML = results.length
      ? results
          .map(
            (item, i) => `
        <li role="option" id="search-option-${i}" aria-selected="false" data-href="${escapeHtml(resultHref(item))}">
          ${imageHtml({ kind: item.type, file: item.icon, alt: '', fallbackText: item.name, className: 'result-icon' })}
          <span>${escapeHtml(item.name)}</span>
          <span class="result-type">${TYPE_LABELS[item.type]}</span>
        </li>`,
          )
          .join('')
      : '<li class="empty" role="option" aria-disabled="true">Ничего не найдено</li>';
    listEl.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  async function update() {
    if (!normalize(input.value)) {
      close();
      return;
    }
    await ensureIndex();
    results = searchIndex(index, input.value);
    render();
  }

  input.addEventListener('focus', ensureIndex, { once: true });
  input.addEventListener('input', update);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (listEl.hidden) return;
      event.preventDefault();
      setActive(active + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter' && !listEl.hidden && results.length) {
      event.preventDefault();
      navigate(resultHref(results[Math.max(active, 0)]));
    }
  });
  listEl.addEventListener('click', (event) => {
    const option = event.target.closest('[data-href]');
    if (option) navigate(option.dataset.href);
  });
  document.addEventListener('click', (event) => {
    if (!listEl.hidden && !event.target.closest('.site-search')) close();
  });
}
