// ── weapons.js ────────────────────────────────────────────────────────────────

let curType = 'all', onlyFive = false;

function renderCards(list) {
  const g = document.getElementById('weapons-grid');
  if (!list.length) {
    g.innerHTML = '<div class="empty-state"><div class="es-icon">🔍</div><div class="es-text">Ничего не найдено</div></div>';
    return;
  }
  g.innerHTML = list.map(w => `
    <div class="weapon-card">
      <div class="w-top">
        <div class="weapon-icon">${w.icon}</div>
        <div>
          <h4>${w.name}</h4>
          <div class="w-type" style="color:${w.rarity === '5★' ? 'var(--gold)' : 'var(--electro)'}">${w.rarity}</div>
          <div class="w-type">${W_NAMES[w.type]}</div>
        </div>
      </div>
      <div class="weapon-stats">
        <div class="stat-row"><div class="s-label">Базовый ATK</div><div class="s-val" style="color:var(--accent)">${w.atk}</div></div>
        <div class="stat-row"><div class="s-label">Доп. стат</div><div class="s-val" style="font-size:.68rem">${w.sub}</div></div>
      </div>
      <div class="weapon-desc">
        <span style="color:var(--accent);font-size:.69rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Пассивка: </span>
        ${w.passive}
        <br><br>
        <em style="color:var(--text-dim);font-size:.72rem">${w.desc}</em>
      </div>
    </div>`).join('');
}

function renderTable(list) {
  document.getElementById('w-tbody').innerHTML = list.map(w => `
    <tr>
      <td><b>${w.icon} ${w.name}</b></td>
      <td>${W_NAMES[w.type]}</td>
      <td style="color:${w.rarity === '5★' ? 'var(--gold)' : 'var(--electro)'};font-weight:700">${w.rarity}</td>
      <td style="color:var(--accent);font-weight:700">${w.atk}</td>
      <td style="font-size:.75rem">${w.sub}</td>
      <td style="font-size:.75rem;max-width:280px;color:var(--text-sub)">${w.passive}</td>
    </tr>`).join('');
}

function setType(t, btn) {
  curType = t;
  document.querySelectorAll('.filter-btn:not(#r5-btn)').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilter();
}

function toggleRarity(btn) {
  onlyFive = !onlyFive;
  btn.classList.toggle('active', onlyFive);
  applyFilter();
}

function applyFilter() {
  const q = (document.getElementById('w-search').value || '').toLowerCase();
  const list = WEAPONS.filter(w =>
    (curType === 'all' || w.type === curType) &&
    (!onlyFive || w.rarity === '5★') &&
    (w.name.toLowerCase().includes(q) || W_NAMES[w.type].toLowerCase().includes(q))
  );
  renderCards(list);
  renderTable(list);
}

function buildSubmit() {
  const u = getUser();
  const wrap = document.getElementById('submit-wrap');
  if (u) {
    wrap.innerHTML = `
      <h3>Предложить данные об оружии</h3>
      <p>Вы вошли как <strong style="color:var(--accent)">${u.name}</strong>. Нашли ошибку или хотите добавить новое оружие?</p>
      <div class="submit-form">
        <select id="s-cat">
          <option value="">— Выберите категорию —</option>
          <option>Ошибка в характеристиках (ATK / стат)</option>
          <option>Ошибка в описании пассивки</option>
          <option>Добавить новое оружие</option>
          <option>Рекомендации по использованию</option>
          <option>Другое</option>
        </select>
        <input type="text" id="s-item" placeholder="Название оружия">
        <textarea id="s-text" placeholder="Подробно опишите..."></textarea>
        <button class="btn-submit" onclick="sendSubmit()">📤 Отправить предложение</button>
      </div>`;
  } else {
    wrap.innerHTML = `
      <h3>Предложить данные об оружии</h3>
      <p>Нашли ошибку в характеристиках? Войдите в аккаунт и предложите правку.</p>
      <div class="sp-login-note">🔒 Требуется аккаунт&nbsp; <a href="auth.html">Войти или зарегистрироваться →</a></div>`;
  }
}

function sendSubmit() {
  const cat  = document.getElementById('s-cat').value;
  const item = (document.getElementById('s-item')?.value || '').trim();
  const text = document.getElementById('s-text').value.trim();
  if (!cat)  { showToast('Выберите категорию', true); return; }
  if (!text) { showToast('Введите описание предложения', true); return; }

  const u = getUser();
  const all = JSON.parse(localStorage.getItem('gw_proposals') || '[]');
  all.push({ user: u.email, cat, item, text, date: new Date().toISOString(), page: 'Оружие' });
  localStorage.setItem('gw_proposals', JSON.stringify(all));

  ['s-cat', 's-item', 's-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const btn = document.querySelector('.btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Отправка...'; }

  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  sendProposalEmail({
    user_name:  u.name,
    user_email: u.email,
    page:       'Оружие',
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
renderCards(WEAPONS);
renderTable(WEAPONS);
buildSubmit();
