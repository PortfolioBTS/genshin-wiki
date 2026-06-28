// ── patches.js ────────────────────────────────────────────────────────────────

document.getElementById('patches-list').innerHTML = PATCHES.map((p, i) => `
  <div class="patch-card">
    <div class="patch-header">
      <span class="patch-version">Версия ${p.version}</span>
      ${i === 0 ? '<span class="patch-badge">Актуальная</span>' : ''}
      <span class="patch-date">${p.date}</span>
    </div>
    <ul>${p.items.map(item => `<li>${item}</li>`).join('')}</ul>
  </div>`).join('');

function buildSubmit() {
  const u = getUser();
  const wrap = document.getElementById('submit-wrap');
  if (u) {
    wrap.innerHTML = `
      <h3>Предложить патчноут или новость</h3>
      <p>Вы вошли как <strong style="color:var(--accent)">${u.name}</strong>. Знаете о новом обновлении?</p>
      <div class="submit-form">
        <select id="s-cat">
          <option value="">— Тип предложения —</option>
          <option>Новый патчноут (версия)</option>
          <option>Ошибка в описании обновления</option>
          <option>Добавить пункт в патчноут</option>
          <option>Другое</option>
        </select>
        <input type="text" id="s-ver" placeholder="Номер версии (например: 5.8)">
        <textarea id="s-text" placeholder="Опишите изменения подробно..."></textarea>
        <button class="btn-submit" onclick="sendSubmit()">📤 Отправить</button>
      </div>`;
  } else {
    wrap.innerHTML = `
      <h3>Предложить патчноут или новость</h3>
      <p>Знаете о новом обновлении раньше всех? Войдите и сообщите сообществу.</p>
      <div class="sp-login-note">🔒 Требуется аккаунт&nbsp; <a href="auth.html">Войти или зарегистрироваться →</a></div>`;
  }
}

function sendSubmit() {
  const cat  = document.getElementById('s-cat').value;
  const item = (document.getElementById('s-ver')?.value || '').trim();
  const text = document.getElementById('s-text').value.trim();
  if (!cat)  { showToast('Выберите категорию', true); return; }
  if (!text) { showToast('Введите описание предложения', true); return; }

  const u = getUser();
  const all = JSON.parse(localStorage.getItem('gw_proposals') || '[]');
  all.push({ user: u.email, cat, item, text, date: new Date().toISOString(), page: 'Патчноуты' });
  localStorage.setItem('gw_proposals', JSON.stringify(all));

  ['s-cat', 's-ver', 's-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const btn = document.querySelector('.btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Отправка...'; }

  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  sendProposalEmail({
    user_name:  u.name,
    user_email: u.email,
    page:       'Патчноуты',
    category:   cat,
    item:       item || '—',
    message:    text,
  }).then(sent => {
    if (btn) { btn.disabled = false; btn.textContent = '📤 Отправить предложение'; }
    showToast(sent
      ? '✓ Предложение отправлено и передано администратору!'
      : '✓ Предложение сохранено (email не настроен — работает в демо-режиме)');
  });
}

const u = getUser();
if (u) { document.getElementById('auth-btn').textContent = '👤 ' + u.name; }
buildSubmit();
