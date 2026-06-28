// ── auth.js ───────────────────────────────────────────────────────────────────

// ── EmailJS init ──────────────────────────────────────────────────────────────
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

// ── State ─────────────────────────────────────────────────────────────────────
let pendingUser  = null;
let verifyCode   = null;
let verifyExpiry = null;
let verifyTimerID = null;
let resendTimerID = null;
let resetEmail   = null;
let resetCode    = null;
let resetExpiry  = null;
let resetTimerID = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const digits      = () => Array.from($('code-wrap').querySelectorAll('.code-digit'));
const resetDigits = () => Array.from($('reset-code-wrap').querySelectorAll('.code-digit'));

function showToast(msg, isErr = false) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast' + (isErr ? ' err' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function setBanner(id, msg, type = 'info') {
  const b = $(id);
  b.textContent = msg;
  b.className = 'status-banner show ' + type;
}
function hideBanner(id) { $(id).className = 'status-banner'; }

function setErr(fid, msg) {
  const i = $(fid), e = $(fid + '-err');
  if (i) i.classList.add('err');
  if (e) { e.textContent = msg; e.classList.add('show'); }
}
function clearErr(inp) {
  inp.classList.remove('err');
  const e = $(inp.id + '-err');
  if (e) e.classList.remove('show');
}
function setLoading(btnId, loading, label = '') {
  const b = $(btnId);
  if (loading) { b.disabled = true; b.innerHTML = `<div class="spinner"></div> Отправка...`; }
  else { b.disabled = false; b.innerHTML = label; }
}

function isEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function genCode()  { return String(Math.floor(100000 + Math.random() * 900000)); }
function hashPass(p, email) { return btoa(encodeURIComponent(p + '_gw_' + email)); }

// ── LocalStorage ──────────────────────────────────────────────────────────────
function getUsers() { try { return JSON.parse(localStorage.getItem('gw_users') || '[]'); } catch (e) { return []; } }
function saveUsers(u) { localStorage.setItem('gw_users', JSON.stringify(u)); }
function getUser()    { try { return JSON.parse(localStorage.getItem('gw_user') || 'null'); } catch (e) { return null; } }
function saveUser(u)  { localStorage.setItem('gw_user', JSON.stringify(u)); }

// ── Password strength ─────────────────────────────────────────────────────────
function _strength(val, fillId, labelId) {
  const f = $(fillId), l = $(labelId);
  if (!f) return;
  if (!val) { f.style.width = '0%'; if (l) l.textContent = ''; return; }
  let s = 0;
  if (val.length >= 8)          s++;
  if (val.length >= 12)         s++;
  if (/[A-Z]/.test(val))        s++;
  if (/[0-9]/.test(val))        s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  const lv = [
    { w: '14%',  bg: '#ef4444', t: 'Очень слабый' },
    { w: '30%',  bg: '#f97316', t: 'Слабый' },
    { w: '54%',  bg: '#eab308', t: 'Средний' },
    { w: '76%',  bg: '#84cc16', t: 'Хороший' },
    { w: '100%', bg: '#34d399', t: 'Отличный' },
  ][Math.min(s, 4)];
  f.style.width = lv.w; f.style.background = lv.bg;
  if (l) { l.textContent = lv.t; l.style.color = lv.bg; }
}
function checkStrength(v)  { _strength(v, 's-fill',  's-label'); }
function checkStrength2(v) { _strength(v, 's2-fill', null); }

// ── Toggle password visibility ────────────────────────────────────────────────
function togglePass(id, btn) {
  const i = $(id);
  i.type = i.type === 'password' ? 'text' : 'password';
  btn.textContent = i.type === 'password' ? '👁' : '🙈';
}

// ── Panel switching ───────────────────────────────────────────────────────────
const ALL_PANELS = ['login', 'register', 'verify', 'forgot', 'reset-code', 'new-pass'];

function showPanel(id) {
  ALL_PANELS.forEach(p => {
    const el = $('panel-' + p);
    if (el) el.classList.remove('active');
  });
  $('success-reg').classList.remove('show');
  $('profile-screen').style.display = 'none';
  const target = $('panel-' + id);
  if (target) target.classList.add('active');
  const hideTabs = ['verify', 'forgot', 'reset-code', 'new-pass'];
  $('tabs-row').style.display = hideTabs.includes(id) ? 'none' : 'grid';
}

function switchTab(tab) {
  showPanel(tab);
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
  });
}

// ── Code input behaviour ──────────────────────────────────────────────────────
function codeInput(e, idx) {
  const dd = digits();
  const v = e.target.value.replace(/\D/g, '');
  e.target.value = v.slice(-1);
  e.target.classList.toggle('filled', !!e.target.value);
  if (e.target.value && idx < 5) dd[idx + 1].focus();
  if (digits().every(d => d.value)) doVerify();
}
function codeKey(e, idx) {
  const dd = digits();
  if (e.key === 'Backspace' && !dd[idx].value && idx > 0) {
    dd[idx - 1].value = ''; dd[idx - 1].classList.remove('filled'); dd[idx - 1].focus();
  }
  if (e.key === 'ArrowLeft'  && idx > 0) dd[idx - 1].focus();
  if (e.key === 'ArrowRight' && idx < 5) dd[idx + 1].focus();
}
function clearCodeInputs() {
  digits().forEach(d => { d.value = ''; d.classList.remove('filled', 'err-digit'); });
}

function resetCodeInput(e, idx) {
  const dd = resetDigits();
  const v = e.target.value.replace(/\D/g, '');
  e.target.value = v.slice(-1);
  e.target.classList.toggle('filled', !!e.target.value);
  if (e.target.value && idx < 5) dd[idx + 1].focus();
}
function resetCodeKey(e, idx) {
  const dd = resetDigits();
  if (e.key === 'Backspace' && !dd[idx].value && idx > 0) {
    dd[idx - 1].value = ''; dd[idx - 1].classList.remove('filled'); dd[idx - 1].focus();
  }
}

// ── Timer helpers ─────────────────────────────────────────────────────────────
function startVerifyTimer() {
  verifyExpiry = Date.now() + 10 * 60 * 1000;
  clearInterval(verifyTimerID);
  verifyTimerID = setInterval(() => {
    const left = Math.max(0, verifyExpiry - Date.now());
    const m = String(Math.floor(left / 60000)).padStart(2, '0');
    const s = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    const el = $('verify-timer');
    if (el) el.textContent = m + ':' + s;
    if (left === 0) {
      clearInterval(verifyTimerID);
      setBanner('verify-banner', 'Время истекло. Отправьте код повторно.', 'bad');
    }
  }, 1000);
}

function startResendTimer() {
  let sec = 60;
  $('resend-link').classList.add('disabled');
  clearInterval(resendTimerID);
  resendTimerID = setInterval(() => {
    sec--;
    const el = $('resend-timer');
    if (el) el.textContent = sec;
    if (sec <= 0) {
      clearInterval(resendTimerID);
      $('resend-link').classList.remove('disabled');
      $('resend-link').innerHTML = 'Отправить повторно';
    }
  }, 1000);
}

function startResetTimer() {
  resetExpiry = Date.now() + 10 * 60 * 1000;
  clearInterval(resetTimerID);
  resetTimerID = setInterval(() => {
    const left = Math.max(0, resetExpiry - Date.now());
    const m = String(Math.floor(left / 60000)).padStart(2, '0');
    const s = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    const el = $('reset-timer');
    if (el) el.textContent = m + ':' + s;
    if (left === 0) clearInterval(resetTimerID);
  }, 1000);
}

// ── Send email via EmailJS ────────────────────────────────────────────────────
async function sendVerifyEmail(toEmail, code) {
  return emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_VERIFY,
    { to_email: toEmail, code: code, user_name: pendingUser?.name || '' }
  );
}

async function sendResetEmail(toEmail, code) {
  return emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_VERIFY,
    { to_email: toEmail, code: code, user_name: 'Пользователь' }
  );
}

// ── REGISTER ──────────────────────────────────────────────────────────────────
async function doRegister() {
  hideBanner('reg-banner');
  const name  = $('r-name').value.trim();
  const email = $('r-email').value.trim().toLowerCase();
  const pass  = $('r-pass').value;
  const pass2 = $('r-pass2').value;
  const agree = $('r-agree').checked;
  let ok = true;

  if (name.length < 2)  { setErr('r-name',  'Минимум 2 символа');              ok = false; }
  if (!isEmail(email))  { setErr('r-email', 'Введите корректный email');         ok = false; }
  if (pass.length < 8)  { setErr('r-pass',  'Минимум 8 символов');              ok = false; }
  if (pass !== pass2)   { setErr('r-pass2', 'Пароли не совпадают');              ok = false; }
  if (!agree)           { showToast('Примите условия использования', true);       ok = false; }
  if (!ok) return;

  const users = getUsers();
  if (users.find(u => u.email === email)) { setErr('r-email', 'Этот email уже зарегистрирован'); return; }

  setLoading('btn-register', true);
  pendingUser = { name, email, hash: hashPass(pass, email) };
  verifyCode  = genCode();

  try {
    await sendVerifyEmail(email, verifyCode);
    $('verify-email-label').textContent = email;
    showPanel('verify');
    startVerifyTimer();
    startResendTimer();
    setBanner('verify-banner', `Код отправлен на ${email}`, 'info');
    setTimeout(() => hideBanner('verify-banner'), 4000);
  } catch (err) {
    console.error(err);
    $('verify-email-label').textContent = email;
    showPanel('verify');
    startVerifyTimer();
    startResendTimer();
    setBanner('verify-banner', `⚠️ EmailJS не настроен. Демо-режим: ваш код — ${verifyCode}`, 'bad');
  } finally {
    setLoading('btn-register', false, 'Создать аккаунт и получить код');
  }
}

// ── VERIFY CODE ───────────────────────────────────────────────────────────────
function doVerify() {
  hideBanner('verify-banner');
  const entered = digits().map(d => d.value).join('');
  if (entered.length < 6) { setBanner('verify-banner', 'Введите все 6 цифр кода', 'bad'); return; }
  if (Date.now() > verifyExpiry) { setBanner('verify-banner', 'Время кода истекло. Запросите новый.', 'bad'); return; }
  if (entered !== verifyCode) {
    digits().forEach(d => { d.classList.add('err-digit'); setTimeout(() => d.classList.remove('err-digit'), 400); });
    setBanner('verify-banner', 'Неверный код. Попробуйте ещё раз.', 'bad');
    clearCodeInputs(); digits()[0].focus();
    return;
  }

  clearInterval(verifyTimerID); clearInterval(resendTimerID);
  const users   = getUsers();
  const newUser = { ...pendingUser, verified: true, joined: new Date().toLocaleDateString('ru-RU') };
  users.push(newUser);
  saveUsers(users);
  saveUser({ name: newUser.name, email: newUser.email, joined: newUser.joined, verified: true });

  $('success-name').textContent = pendingUser.name;
  $('tabs-row').style.display = 'none';
  ALL_PANELS.forEach(p => { const el = $('panel-' + p); if (el) el.classList.remove('active'); });
  $('success-reg').classList.add('show');
}

// ── RESEND CODE ───────────────────────────────────────────────────────────────
async function resendCode() {
  verifyCode = genCode();
  clearCodeInputs(); digits()[0].focus();
  try {
    await sendVerifyEmail(pendingUser.email, verifyCode);
    setBanner('verify-banner', 'Новый код отправлен на вашу почту', 'ok');
  } catch (e) {
    setBanner('verify-banner', `Демо-режим: новый код — ${verifyCode}`, 'bad');
  }
  startVerifyTimer();
  startResendTimer();
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function doLogin() {
  hideBanner('login-banner');
  const email = $('l-email').value.trim().toLowerCase();
  const pass  = $('l-pass').value;
  let ok = true;
  if (!isEmail(email)) { setErr('l-email', 'Введите корректный email'); ok = false; }
  if (!pass)           { setErr('l-pass',  'Введите пароль');           ok = false; }
  if (!ok) return;

  const users = getUsers();
  const user  = users.find(u => u.email === email && u.hash === hashPass(pass, email));
  if (!user) {
    setBanner('login-banner', 'Неверный email или пароль', 'bad');
    $('l-email').classList.add('err'); $('l-pass').classList.add('err');
    return;
  }
  if (!user.verified) {
    pendingUser = { name: user.name, email: user.email, hash: user.hash };
    verifyCode  = genCode();
    $('verify-email-label').textContent = user.email;
    sendVerifyEmail(user.email, verifyCode)
      .catch(() => { setBanner('verify-banner', `Демо-режим: код — ${verifyCode}`, 'bad'); });
    showPanel('verify'); startVerifyTimer(); startResendTimer();
    setBanner('verify-banner', 'Ваша почта не подтверждена. Новый код отправлен.', 'info');
    return;
  }
  saveUser({ name: user.name, email: user.email, joined: user.joined, verified: true });
  showToast('✓ Вы вошли как ' + user.name);
  setTimeout(showProfile, 700);
}

// ── FORGOT / RESET ────────────────────────────────────────────────────────────
async function doForgot() {
  hideBanner('forgot-banner');
  const email = $('f-email').value.trim().toLowerCase();
  if (!isEmail(email)) { setErr('f-email', 'Введите корректный email'); return; }
  const users = getUsers();
  if (!users.find(u => u.email === email)) { setErr('f-email', 'Аккаунт с таким email не найден'); return; }

  setLoading('btn-forgot', true);
  resetEmail = email;
  resetCode  = genCode();

  try {
    await sendResetEmail(email, resetCode);
    $('reset-email-label').textContent = email;
    showPanel('reset-code');
    startResetTimer();
    setBanner('reset-code-banner', 'Код отправлен на вашу почту', 'info');
  } catch (e) {
    $('reset-email-label').textContent = email;
    showPanel('reset-code');
    startResetTimer();
    setBanner('reset-code-banner', `Демо-режим: код — ${resetCode}`, 'bad');
  } finally {
    setLoading('btn-forgot', false, 'Отправить код сброса');
  }
}

function doVerifyReset() {
  const entered = resetDigits().map(d => d.value).join('');
  if (entered.length < 6) { setBanner('reset-code-banner', 'Введите все 6 цифр', 'bad'); return; }
  if (entered !== resetCode) {
    resetDigits().forEach(d => { d.classList.add('err-digit'); setTimeout(() => d.classList.remove('err-digit'), 400); });
    setBanner('reset-code-banner', 'Неверный код', 'bad');
    resetDigits().forEach(d => d.value = ''); resetDigits()[0].focus();
    return;
  }
  clearInterval(resetTimerID);
  showPanel('new-pass');
}

function doNewPassword() {
  const p  = $('np-pass').value;
  const p2 = $('np-pass2').value;
  if (p.length < 8) { setBanner('new-pass-banner', 'Минимум 8 символов', 'bad'); return; }
  if (p !== p2)     { setBanner('new-pass-banner', 'Пароли не совпадают', 'bad'); return; }
  const users = getUsers();
  const idx   = users.findIndex(u => u.email === resetEmail);
  if (idx < 0)  { setBanner('new-pass-banner', 'Ошибка — аккаунт не найден', 'bad'); return; }
  users[idx].hash = hashPass(p, resetEmail);
  saveUsers(users);
  showToast('✓ Пароль успешно изменён!');
  setTimeout(() => switchTab('login'), 1200);
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
function doLogout() {
  localStorage.removeItem('gw_user');
  showToast('Вы вышли из аккаунта');
  setTimeout(() => { $('profile-screen').style.display = 'none'; switchTab('login'); }, 700);
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
function showProfile() {
  const u = getUser();
  if (!u) return;
  ALL_PANELS.forEach(p => { const el = $('panel-' + p); if (el) el.classList.remove('active'); });
  $('tabs-row').style.display = 'none';
  $('success-reg').classList.remove('show');

  $('p-avatar').textContent  = u.name.charAt(0).toUpperCase();
  $('p-name').textContent    = u.name;
  $('p-email').textContent   = u.email;
  $('p-joined').textContent  = u.joined || '—';

  const props = JSON.parse(localStorage.getItem('gw_proposals') || '[]').filter(p => p.user === u.email);
  $('p-proposals').textContent = props.length;

  if (!props.length) {
    $('p-proposals-list').innerHTML = '<div class="no-proposals">Вы ещё не отправляли предложений.</div>';
  } else {
    $('p-proposals-list').innerHTML = props.slice().reverse().slice(0, 5).map(p => `
      <div class="proposal-item">
        <span class="proposal-date">${new Date(p.date).toLocaleDateString('ru-RU')}</span>
        <strong>[${p.page}]</strong> ${p.cat}${p.text ? ' — ' + p.text.slice(0, 55) + (p.text.length > 55 ? '…' : '') : ''}
      </div>`).join('');
  }
  $('profile-screen').style.display = 'block';
}

// ── INIT ──────────────────────────────────────────────────────────────────────
(function init() {
  const u = getUser();
  if (u) showProfile();
})();
