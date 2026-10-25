import { escapeHtml } from '../lib/escape-html.js';

/** Группа кнопок-фильтров; выбранная помечена aria-pressed. */
export function chipGroupHtml(name, label, options, current) {
  const buttons = options
    .map(
      ({ value, label: text }) =>
        `<button type="button" class="chip" data-filter="${escapeHtml(name)}" data-value="${escapeHtml(value)}" aria-pressed="${value === current}">${escapeHtml(text)}</button>`,
    )
    .join('');
  return `<div class="filter-group" role="group" aria-label="${escapeHtml(label)}"><span class="filter-label" aria-hidden="true">${escapeHtml(label)}</span>${buttons}</div>`;
}

/** Тот же фильтр в виде выпадающего списка — для длинных списков значений. */
export function selectFilterHtml(name, label, options, current) {
  const items = options
    .map(
      ({ value, label: text }) =>
        `<option value="${escapeHtml(value)}"${value === current ? ' selected' : ''}>${escapeHtml(text)}</option>`,
    )
    .join('');
  return `<label class="filter-group"><span class="filter-label">${escapeHtml(label)}</span><select class="select-input" data-filter="${escapeHtml(name)}">${items}</select></label>`;
}

export function bindChips(root, onChange) {
  root.addEventListener('click', (event) => {
    const chip = event.target.closest('button[data-filter]');
    if (chip && root.contains(chip)) onChange(chip.dataset.filter, chip.dataset.value);
  });
  root.addEventListener('change', (event) => {
    const select = event.target.closest('select[data-filter]');
    if (select && root.contains(select)) onChange(select.dataset.filter, select.value);
  });
}

export function syncChips(root, state) {
  root.querySelectorAll('button[data-filter]').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(state[chip.dataset.filter] === chip.dataset.value));
  });
  root.querySelectorAll('select[data-filter]').forEach((select) => {
    if (select.dataset.filter in state) select.value = state[select.dataset.filter];
  });
}
