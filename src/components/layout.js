import { DATA_AS_OF } from '../data/content/site.js';
import { getCurrentUser } from '../lib/session.js';
import { installImageFallbacks } from './game-image.js';

function setMenu(toggle, open) {
  document.body.classList.toggle('nav-open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

let escapeBound = false;

function initMenu() {
  const toggle = document.getElementById('nav-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () =>
    setMenu(toggle, !document.body.classList.contains('nav-open')),
  );
  if (escapeBound) return;
  escapeBound = true;
  document.addEventListener('keydown', (event) => {
    const current = document.getElementById('nav-toggle');
    if (event.key === 'Escape' && current && document.body.classList.contains('nav-open')) {
      setMenu(current, false);
      current.focus();
    }
  });
}

/** Общая инициализация шапки и подвала; каждая страница вызывает её первой. */
export function initLayout() {
  const user = getCurrentUser();
  const authBtn = document.getElementById('auth-btn');
  if (user && authBtn) authBtn.textContent = `👤 ${user.name}`;

  initMenu();
  document.querySelectorAll('[data-as-of]').forEach((el) => {
    el.textContent = DATA_AS_OF;
  });
  installImageFallbacks();
}
