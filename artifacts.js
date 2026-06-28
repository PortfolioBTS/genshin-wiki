// ── artifacts.js ─────────────────────────────────────────────────────────────

let curRole = 'all';
const ROLE_LABEL = { dps: 'DPS / Атака', support: 'Саппорт', healer: 'Хилер' };
const ROLE_COLOR = { dps: 'var(--pyro)', support: 'var(--accent)', healer: 'var(--anemo)' };

function renderCards(list) {
  const g = document.getElementById('artifacts-grid');
  if (!list.length) {
    g.innerHTML = '<div class="empty-state"><div class="es-icon">🔍</div><div class="es-text">Ничего не найдено</div></div>';
    return;
  }
  g.innerHTML = list.map(a => `
    <div class="artifact-card">
      <div class="a-header">
        <div class="artifact-icon">${a.icon}</div>
        <div>
          <h4>${a.name}</h4>
          <div class="a-role" style="color:${ROLE_COLOR[a.role]}">${ROLE_LABEL[a.role] || a.role}</div>
        </div>
      </div>
      <ul class="bonus-list">
        ${a.bonuses.map(b => `<li>${b}</li>`).join('')}
      </ul>
    </div>`).join('');
}

function renderTable(list) {
  document.getElementById('a-tbody').innerHTML = list.map(a => {
    const plain = s => s.replace(/<[^>]+>/g, '');
    return `<tr>
      <td><b>${a.icon} ${a.name}</b></td>
      <td style="color:${ROLE_COLOR[a.role]};font-size:.75rem">${ROLE_LABEL[a.role] || a.role}</td>
      <td style="font-size:.75rem;max-width:180px;color:var(--text-sub)">${plain(a.bonuses[0] || '')}</td>
      <td style="font-size:.75rem;max-width:260px;color:var(--text-sub)">${plain(a.bonuses[1] || '')}</td>
    </tr>`;
  }).join('');
}

function setRole(r, btn) {
  curRole = r;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilter();
}

function applyFilter() {
  const q = (document.getElementById('a-search').value || '').toLowerCase();
  const list = ARTIFACTS.filter(a =>
    (curRole === 'all' || a.role === curRole) && a.name.toLowerCase().includes(q)
  );
  renderCards(list);
  renderTable(list);
}

function buildSubmit() {
  const u = getUser();
  const wrap = document.getElementById('submit-wrap');
  if (u) {
    wrap.innerHTML = `
      <h3>Предложить информацию об артефактах</h3>
      <p>Вы вошли как <strong style="color:var(--accent)">${u.name}</strong>. Есть идеи по описанию сетов или рекомендации?</p>
      <div class="submit-form">
        <select id="s-cat">
          <option value="">— Выберите категорию —</option>
          <option>Ошибка в бонусах</option>
          <option>Новый сет артефактов</option>
          <option>Рекомендации по использованию</option>
          <option>Лучшие комбинации для персонажа</option>
          <option>Другое</option>
        </select>
        <input type="text" id="s-set" placeholder="Название сета (если применимо)">
        <textarea id="s-text" placeholder="Подробно опишите..."></textarea>
        <button class="btn-submit" onclick="sendSubmit()">📤 Отправить предложение</button>
      </div>`;
  } else {
    wrap.innerHTML = `
      <h3>Предложить информацию об артефактах</h3>
      <p>Есть идеи по описанию сетов или рекомендации? Войдите и поделитесь с сообществом.</p>
      <div class="sp-login-note">🔒 Требуется аккаунт&nbsp; <a href="auth.html">Войти или зарегистрироваться →</a></div>`;
  }
}

function sendSubmit() {
  const cat  = document.getElementById('s-cat').value;
  const item = (document.getElementById('s-set')?.value || '').trim();
  const text = document.getElementById('s-text').value.trim();
  if (!cat)  { showToast('Выберите категорию', true); return; }
  if (!text) { showToast('Введите описание предложения', true); return; }

  const u = getUser();
  const all = JSON.parse(localStorage.getItem('gw_proposals') || '[]');
  all.push({ user: u.email, cat, item, text, date: new Date().toISOString(), page: 'Артефакты' });
  localStorage.setItem('gw_proposals', JSON.stringify(all));

  ['s-cat', 's-set', 's-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const btn = document.querySelector('.btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Отправка...'; }

  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  sendProposalEmail({
    user_name:  u.name,
    user_email: u.email,
    page:       'Артефакты',
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
renderCards(ARTIFACTS);
renderTable(ARTIFACTS);
buildSubmit();
