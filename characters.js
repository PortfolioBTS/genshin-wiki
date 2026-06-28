// ── characters.js ────────────────────────────────────────────────────────────

let curEl = 'all';

function renderGrid(list) {
  const g = document.getElementById('chars-grid');
  if (!list.length) {
    g.innerHTML = '<div class="empty-state"><div class="es-icon">🔍</div><div class="es-text">Ничего не найдено — попробуйте изменить фильтр</div></div>';
    return;
  }
  g.innerHTML = list.map(c => `
    <div class="char-card">
      <div class="card-top bg-${c.el}">
        <span>${c.icon}</span>
        <span class="card-rarity">${c.rarity}</span>
        <span class="card-element">${EL_ICONS[c.el]}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${c.name}</div>
        <div class="card-meta">${c.region} · ${c.weapon}</div>
        <div class="card-tags">
          <span class="tag el-${c.el}">${EL_NAMES[c.el]}</span>
          <span class="tag" style="border-color:#2a3a5a;color:var(--text-sub)">${c.role}</span>
        </div>
        <div class="card-lore">${c.desc}</div>
      </div>
    </div>`).join('');
}

function renderTable(list) {
  document.getElementById('chars-tbody').innerHTML = list.map(c => `
    <tr>
      <td><b>${c.icon} ${c.name}</b></td>
      <td style="color:var(--gold);font-weight:700">${c.rarity}</td>
      <td><span class="tag el-${c.el}">${EL_ICONS[c.el]} ${EL_NAMES[c.el]}</span></td>
      <td>${c.weapon}</td>
      <td>${c.region}</td>
      <td style="color:var(--accent)">${c.role}</td>
      <td style="max-width:240px;font-size:.74rem;color:var(--text-sub)">${c.desc}</td>
    </tr>`).join('');
}

function setEl(el, btn) {
  curEl = el;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilter();
}

function applyFilter() {
  const q = (document.getElementById('char-search').value || '').toLowerCase();
  const list = CHARS.filter(c =>
    (curEl === 'all' || c.el === curEl) &&
    (c.name.toLowerCase().includes(q) ||
     c.region.toLowerCase().includes(q) ||
     c.weapon.toLowerCase().includes(q) ||
     c.role.toLowerCase().includes(q))
  );
  renderGrid(list);
  renderTable(list);
}

function buildSubmit() {
  const u = getUser();
  const wrap = document.getElementById('submit-wrap');
  if (u) {
    wrap.innerHTML = `
      <h3>Предложить информацию о персонаже</h3>
      <p>Вы вошли как <strong style="color:var(--accent)">${u.name}</strong>. Заполните форму ниже — администраторы рассмотрят ваше предложение.</p>
      <div class="submit-form">
        <select id="s-cat">
          <option value="">— Выберите категорию —</option>
          <option>Ошибка в описании / лоре</option>
          <option>Ошибка в характеристиках</option>
          <option>Добавить нового персонажа</option>
          <option>Дополнение к роли / билду</option>
          <option>Другое</option>
        </select>
        <input type="text" id="s-char" placeholder="Имя персонажа (если применимо)">
        <textarea id="s-text" placeholder="Подробно опишите ваше предложение..."></textarea>
        <button class="btn-submit" onclick="sendSubmit()">📤 Отправить предложение</button>
      </div>`;
  } else {
    wrap.innerHTML = `
      <h3>Предложить информацию о персонаже</h3>
      <p>Заметили ошибку или хотите добавить данные? Войдите в аккаунт и отправьте предложение — это занимает меньше минуты.</p>
      <div class="sp-login-note">🔒 Требуется аккаунт&nbsp; <a href="auth.html">Войти или зарегистрироваться →</a></div>`;
  }
}

function sendSubmit() {
  const cat  = document.getElementById('s-cat').value;
  const item = (document.getElementById('s-char')?.value || '').trim();
  const text = document.getElementById('s-text').value.trim();
  if (!cat)  { showToast('Выберите категорию', true); return; }
  if (!text) { showToast('Введите описание предложения', true); return; }

  const u = getUser();
  const all = JSON.parse(localStorage.getItem('gw_proposals') || '[]');
  all.push({ user: u.email, cat, item, text, date: new Date().toISOString(), page: 'Персонажи' });
  localStorage.setItem('gw_proposals', JSON.stringify(all));

  ['s-cat', 's-char', 's-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const btn = document.querySelector('.btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Отправка...'; }

  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  sendProposalEmail({
    user_name:  u.name,
    user_email: u.email,
    page:       'Персонажи',
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

// URL param filter support (from index.html elem-chips)
const urlEl = new URLSearchParams(location.search).get('el');
if (urlEl) {
  curEl = urlEl;
  const btn = document.querySelector(`.filter-btn[onclick*="'${urlEl}'"]`);
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

const u = getUser();
if (u) { document.getElementById('auth-btn').textContent = '👤 ' + u.name; }
renderGrid(CHARS);
renderTable(CHARS);
if (urlEl) applyFilter();
buildSubmit();
