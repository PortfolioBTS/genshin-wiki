import { escapeHtml } from '../lib/escape-html.js';
import { isEmailConfigured, sendProposal } from '../lib/emailjs.js';
import { addProposal } from '../lib/proposals.js';
import { getCurrentUser } from '../lib/session.js';
import { showToast } from './toast.js';

const SUBMIT_LABEL = '📤 Отправить предложение';

function guestHtml(title, intro) {
  return `
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(intro)} Чтобы отправить предложение, войдите в демо-аккаунт.</p>
    <div class="login-note">🔒 Нужен аккаунт <a href="auth.html">Войти или зарегистрироваться →</a></div>`;
}

function formHtml({ title, intro, categories, itemPlaceholder }, user) {
  const delivery = isEmailConfigured() ? ' и отправляются администратору' : '';
  const options = categories.map((c) => `<option>${escapeHtml(c)}</option>`).join('');
  return `
    <h2>${escapeHtml(title)}</h2>
    <p>Вы вошли как <strong>${escapeHtml(user.name)}</strong>. ${escapeHtml(intro)}</p>
    <p class="demo-note">Демо: предложения сохраняются в этом браузере${delivery}.</p>
    <form class="submit-form" novalidate>
      <label class="visually-hidden" for="s-cat">Категория</label>
      <select id="s-cat"><option value="">— Выберите категорию —</option>${options}</select>
      <label class="visually-hidden" for="s-item">Объект</label>
      <input id="s-item" type="text" maxlength="100" placeholder="${escapeHtml(itemPlaceholder)}" />
      <label class="visually-hidden" for="s-text">Описание</label>
      <textarea id="s-text" maxlength="2000" placeholder="Подробно опишите предложение…"></textarea>
      <button class="btn-primary" type="submit">${SUBMIT_LABEL}</button>
    </form>`;
}

/** Форма «предложить правку»; страница передаёт свои категории. */
export function mountProposalForm(container, options) {
  const user = getCurrentUser();
  if (!user) {
    container.innerHTML = guestHtml(options.title, options.intro);
    return;
  }
  container.innerHTML = formHtml(options, user);
  const form = container.querySelector('form');
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const cat = form.querySelector('#s-cat').value;
    const item = form.querySelector('#s-item').value.trim();
    const text = form.querySelector('#s-text').value.trim();
    if (!cat) return showToast('Выберите категорию', true);
    if (!text) return showToast('Введите описание предложения', true);

    addProposal({ user: user.email, page: options.page, cat, item, text });
    form.reset();
    button.disabled = true;
    button.textContent = 'Отправка…';
    const sent = await sendProposal({
      user_name: user.name,
      user_email: user.email,
      page: options.page,
      category: cat,
      item: item || '—',
      message: text,
    });
    button.disabled = false;
    button.textContent = SUBMIT_LABEL;
    showToast(
      sent
        ? '✓ Предложение отправлено администратору'
        : '✓ Предложение сохранено локально (демо-режим)',
    );
  });
}
