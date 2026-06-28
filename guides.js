// ── guides.js ─────────────────────────────────────────────────────────────────

let curTag = 'all';

function render(list) {
  const g = document.getElementById('guides-list');
  if (!list.length) {
    g.innerHTML = '<div class="empty-state"><div class="es-icon">🔍</div><div class="es-text">Нет гайдов в этой категории</div></div>';
    return;
  }
  g.innerHTML = list.map((gd, i) => `
    <div class="guide-card">
      <div class="guide-num">${String(i + 1).padStart(2, '0')}</div>
      <div style="flex:1">
        <h4>${gd.title}</h4>
        <p>${gd.desc}</p>
      </div>
      <span class="guide-tag">${gd.tag}</span>
    </div>`).join('');
}

function setTag(tag, btn) {
  curTag = tag;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render(tag === 'all' ? GUIDES : GUIDES.filter(g => g.tag === tag));
}

function buildSubmit() {
  const u = getUser();
  const wrap = document.getElementById('submit-wrap');
  if (u) {
    wrap.innerHTML = `
      <h3>Предложить гайд или дополнение</h3>
      <p>Вы вошли как <strong style="color:var(--accent)">${u.name}</strong>. Поделитесь своим опытом с сообществом!</p>
      <div class="submit-form">
        <select id="s-cat">
          <option value="">— Тип предложения —</option>
          <option>Новый гайд</option>
          <option>Дополнение к существующему гайду</option>
          <option>Ошибка или устаревшая информация</option>
          <option>Другое</option>
        </select>
        <input type="text" id="s-title" placeholder="Название гайда / раздела">
        <textarea id="s-text" placeholder="Содержание или подробное описание..."></textarea>
        <button class="btn-submit" onclick="sendSubmit()">📤 Отправить предложение</button>
      </div>`;
  } else {
    wrap.innerHTML = `
      <h3>Предложить гайд или дополнение</h3>
      <p>Знаете что-то полезное? Войдите в аккаунт и поделитесь опытом с сообществом.</p>
      <div class="sp-login-note">🔒 Требуется аккаунт&nbsp; <a href="auth.html">Войти или зарегистрироваться →</a></div>`;
  }
}

function sendSubmit() {
  const cat  = document.getElementById('s-cat').value;
  const item = (document.getElementById('s-title')?.value || '').trim();
  const text = document.getElementById('s-text').value.trim();
  if (!cat)  { showToast('Выберите категорию', true); return; }
  if (!text) { showToast('Введите описание предложения', true); return; }

  const u = getUser();
  const all = JSON.parse(localStorage.getItem('gw_proposals') || '[]');
  all.push({ user: u.email, cat, item, text, date: new Date().toISOString(), page: 'Гайды' });
  localStorage.setItem('gw_proposals', JSON.stringify(all));

  ['s-cat', 's-title', 's-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const btn = document.querySelector('.btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Отправка...'; }

  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  sendProposalEmail({
    user_name:  u.name,
    user_email: u.email,
    page:       'Гайды',
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
render(GUIDES);
buildSubmit();
