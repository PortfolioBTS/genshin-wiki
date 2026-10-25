import { readJson, writeJson } from '../lib/storage.js';

const VIEWS = ['cards', 'table'];

/** Переключатель «карточки / таблица»; выбор запоминается в localStorage. */
export function initViewToggle(root, storageKey, onChange) {
  const stored = readJson(storageKey, 'cards');
  let view = VIEWS.includes(stored) ? stored : 'cards';

  const sync = () =>
    root.querySelectorAll('[data-view]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.view === view));
    });

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view]');
    if (!button || !VIEWS.includes(button.dataset.view) || button.dataset.view === view) return;
    view = button.dataset.view;
    writeJson(storageKey, view);
    sync();
    onChange(view);
  });

  sync();
  return view;
}
