import '../styles/main.css';
import '../styles/pages/auth.css';
import { codeInputHtml, initCodeInput } from '../components/code-input.js';
import { initLayout } from '../components/layout.js';
import { showToast } from '../components/toast.js';
import {
  findUser,
  generateCode,
  hashPassword,
  isEmail,
  passwordStrength,
  upsertUser,
  validateRegistration,
  verifyPassword,
} from '../lib/auth.js';
import { sendVerifyCode } from '../lib/emailjs.js';
import { escapeHtml } from '../lib/escape-html.js';
import { getProposalsFor } from '../lib/proposals.js';
import { clearCurrentUser, getCurrentUser, setCurrentUser } from '../lib/session.js';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_DELAY_S = 60;
const STORAGE_ERROR =
  'Хранилище браузера недоступно (приватный режим или запрет данных сайта), поэтому демо-аккаунт не сохранить.';
const GENERIC_ERROR = 'Что-то пошло не так. Попробуйте ещё раз или очистите данные сайта.';

const $ = (id) => document.getElementById(id);
const card = $('auth-card');

// ── Состояние ────────────────────────────────────────────────────────────────

let pending = null; // регистрация, ожидающая кода: { name, email, hash, salt }
let verify = null; // { code, expires }
let reset = null; // { email, code, expires, confirmed }
const timers = {};

// ── Панели и сообщения ───────────────────────────────────────────────────────

const TAB_PANELS = ['login', 'register'];

function showPanel(name, { focus = true } = {}) {
  card.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== name;
  });
  const tabs = $('auth-tabs');
  tabs.hidden = !TAB_PANELS.includes(name);
  tabs.querySelectorAll('[role="tab"]').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab.dataset.action === `tab:${name}`));
  });
  if (name === 'profile') renderProfile();
  if (focus) card.querySelector(`[data-panel="${name}"] input`)?.focus();
}

function setBanner(id, message, tone = 'info') {
  const banner = $(id);
  banner.textContent = message;
  banner.className = `status-banner show ${tone}`;
}

function hideBanner(id) {
  $(id).className = 'status-banner';
}

function setFieldError(inputId, message) {
  const input = $(inputId);
  const error = $(`${inputId}-err`);
  input?.classList.add('err');
  input?.setAttribute('aria-invalid', 'true');
  if (error) {
    error.textContent = message;
    error.classList.add('show');
  }
}

function clearFieldError(input) {
  input.classList.remove('err');
  input.removeAttribute('aria-invalid');
  $(`${input.id}-err`)?.classList.remove('show');
}

async function withBusy(button, label, task) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${label}`;
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

// ── Таймеры ──────────────────────────────────────────────────────────────────

function startCountdown(name, seconds, onTick, onDone) {
  clearInterval(timers[name]);
  let left = seconds;
  onTick(left);
  timers[name] = setInterval(() => {
    left -= 1;
    onTick(left);
    if (left <= 0) {
      clearInterval(timers[name]);
      onDone?.();
    }
  }, 1000);
}

const mmss = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function startCodeTimer(name, timerId, bannerId) {
  startCountdown(
    name,
    CODE_TTL_MS / 1000,
    (left) => {
      $(timerId).textContent = mmss(Math.max(left, 0));
    },
    () => setBanner(bannerId, 'Время действия кода истекло. Запросите новый.', 'bad'),
  );
}

function startResendTimer() {
  const button = $('resend-btn');
  button.disabled = true;
  button.innerHTML = `Отправить повторно (<span id="resend-timer">${RESEND_DELAY_S}</span> с)`;
  startCountdown(
    'resend',
    RESEND_DELAY_S,
    (left) => {
      const el = $('resend-timer');
      if (el) el.textContent = left;
    },
    () => {
      button.disabled = false;
      button.textContent = 'Отправить повторно';
    },
  );
}

// ── Коды подтверждения ───────────────────────────────────────────────────────

async function deliverCode(email, name, bannerId) {
  const code = generateCode();
  const sent = await sendVerifyCode({ toEmail: email, code, userName: name });
  if (sent) setBanner(bannerId, `Код отправлен на ${email}`, 'info');
  else setBanner(bannerId, `Демо-режим: ваш код — ${code}`, 'warn');
  return { code, expires: Date.now() + CODE_TTL_MS };
}

const verifyCodeInput = mountCode('verify-code-slot', 'verify-code', () =>
  run(doVerify, $('verify-code')),
);
const resetCodeInput = mountCode('reset-code-slot', 'reset-code', () =>
  run(doVerifyReset, $('reset-code')),
);

function mountCode(slotId, id, onComplete) {
  $(slotId).outerHTML = codeInputHtml(id, 'Шестизначный код');
  return initCodeInput($(id), onComplete);
}

function checkCode(control, state, bannerId) {
  const entered = control.getValue();
  if (entered.length < 6) {
    setBanner(bannerId, 'Введите все 6 цифр кода', 'bad');
    return false;
  }
  if (!state || Date.now() > state.expires) {
    setBanner(bannerId, 'Время действия кода истекло. Запросите новый.', 'bad');
    return false;
  }
  if (entered !== state.code) {
    control.markError();
    control.clear();
    setBanner(bannerId, 'Неверный код. Попробуйте ещё раз.', 'bad');
    return false;
  }
  return true;
}

async function startVerification(user) {
  pending = user;
  $('verify-email').textContent = user.email;
  verifyCodeInput.clear();
  showPanel('verify');
  verify = await deliverCode(user.email, user.name, 'verify-banner');
  startCodeTimer('verify', 'verify-timer', 'verify-banner');
  startResendTimer();
  verifyCodeInput.focus();
}

// ── Действия ─────────────────────────────────────────────────────────────────

async function doRegister() {
  hideBanner('register-banner');
  const form = {
    name: $('r-name').value.trim(),
    email: $('r-email').value.trim().toLowerCase(),
    pass: $('r-pass').value,
    pass2: $('r-pass2').value,
    agree: $('r-agree').checked,
  };
  const errors = validateRegistration(form);
  const fieldIds = {
    name: 'r-name',
    email: 'r-email',
    pass: 'r-pass',
    pass2: 'r-pass2',
    agree: 'r-agree',
  };
  Object.entries(errors).forEach(([field, message]) => setFieldError(fieldIds[field], message));
  if (Object.keys(errors).length) return;
  if (findUser(form.email)) {
    setFieldError('r-email', 'Этот email уже зарегистрирован');
    return;
  }
  await withBusy($('btn-register'), 'Создаём…', async () => {
    const { hash, salt } = await hashPassword(form.pass);
    await startVerification({ name: form.name, email: form.email, hash, salt });
  });
}

function doVerify() {
  hideBanner('verify-banner');
  if (!pending || !checkCode(verifyCodeInput, verify, 'verify-banner')) return;
  const joined = new Date().toLocaleDateString('ru-RU');
  const saved =
    upsertUser({ ...pending, verified: true, joined }) &&
    setCurrentUser({ name: pending.name, email: pending.email, joined });
  if (!saved) {
    setBanner('verify-banner', STORAGE_ERROR, 'bad');
    return;
  }
  clearInterval(timers.verify);
  clearInterval(timers.resend);
  $('success-name').textContent = pending.name;
  pending = null;
  verify = null;
  refreshHeader();
  showPanel('success');
}

async function doResend() {
  if (!pending) return;
  verifyCodeInput.clear();
  verify = await deliverCode(pending.email, pending.name, 'verify-banner');
  startCodeTimer('verify', 'verify-timer', 'verify-banner');
  startResendTimer();
}

async function doLogin() {
  hideBanner('login-banner');
  const email = $('l-email').value.trim().toLowerCase();
  const pass = $('l-pass').value;
  if (!isEmail(email)) setFieldError('l-email', 'Введите корректный email');
  if (!pass) setFieldError('l-pass', 'Введите пароль');
  if (!isEmail(email) || !pass) return;

  await withBusy($('btn-login'), 'Проверяем…', async () => {
    const user = findUser(email);
    const result = user ? await verifyPassword(user, pass) : { ok: false };
    if (!result.ok) {
      setBanner('login-banner', 'Неверный email или пароль', 'bad');
      return;
    }
    const current = result.upgrade ? { ...user, ...result.upgrade } : user;
    if (result.upgrade) upsertUser(current);
    if (!current.verified) {
      await startVerification(current);
      return;
    }
    if (!setCurrentUser(current)) {
      setBanner('login-banner', STORAGE_ERROR, 'bad');
      return;
    }
    refreshHeader();
    $('l-pass').value = '';
    showToast(`✓ Вы вошли как ${current.name}`);
    showPanel('profile');
  });
}

async function doForgot() {
  hideBanner('forgot-banner');
  const email = $('f-email').value.trim().toLowerCase();
  if (!isEmail(email)) return setFieldError('f-email', 'Введите корректный email');
  const user = findUser(email);
  if (!user) return setFieldError('f-email', 'Аккаунт с таким email не найден');
  await withBusy($('btn-forgot'), 'Отправляем…', async () => {
    $('reset-email').textContent = email;
    resetCodeInput.clear();
    showPanel('reset-code');
    reset = { email, confirmed: false, ...(await deliverCode(email, user.name, 'reset-banner')) };
    startCodeTimer('reset', 'reset-timer', 'reset-banner');
    resetCodeInput.focus();
  });
}

function doVerifyReset() {
  hideBanner('reset-banner');
  if (!checkCode(resetCodeInput, reset, 'reset-banner')) return;
  clearInterval(timers.reset);
  reset.confirmed = true;
  showPanel('new-pass');
}

async function doNewPassword() {
  hideBanner('new-pass-banner');
  const pass = $('np-pass').value;
  if (pass.length < 8) return setBanner('new-pass-banner', 'Минимум 8 символов', 'bad');
  if (pass !== $('np-pass2').value)
    return setBanner('new-pass-banner', 'Пароли не совпадают', 'bad');
  const user = reset?.confirmed && findUser(reset.email);
  if (!user) return setBanner('new-pass-banner', 'Сначала подтвердите код сброса', 'bad');
  const saved = await withBusy($('btn-new-pass'), 'Сохраняем…', async () =>
    upsertUser({ ...user, ...(await hashPassword(pass)) }),
  );
  if (!saved) return setBanner('new-pass-banner', STORAGE_ERROR, 'bad');
  reset = null;
  ['np-pass', 'np-pass2'].forEach((id) => {
    $(id).value = '';
  });
  showToast('✓ Пароль изменён. Войдите с новым паролем');
  $('l-email').value = user.email;
  showPanel('login');
}

function doLogout() {
  clearCurrentUser();
  refreshHeader();
  showToast('Вы вышли из аккаунта');
  showPanel('login');
}

// ── Профиль и шапка ──────────────────────────────────────────────────────────

function refreshHeader() {
  const user = getCurrentUser();
  $('auth-btn').textContent = user ? `👤 ${user.name}` : 'Войти';
}

function renderProfile() {
  const user = getCurrentUser();
  if (!user) return;
  $('p-avatar').textContent = user.name.charAt(0).toUpperCase();
  $('p-name').textContent = user.name;
  $('p-email').textContent = user.email;
  $('p-joined').textContent = user.joined || '—';
  const proposals = getProposalsFor(user.email);
  $('p-proposals').textContent = proposals.length;
  $('p-proposals-list').innerHTML = proposals.length
    ? proposals
        .slice(0, 5)
        .map((p) => {
          const full = String(p.text ?? '');
          const text = full.length > 60 ? `${full.slice(0, 60)}…` : full;
          return `<div class="proposal-item"><span class="proposal-date">${new Date(p.date).toLocaleDateString('ru-RU')}</span><strong>[${escapeHtml(p.page)}]</strong> ${escapeHtml(p.cat)} — ${escapeHtml(text)}</div>`;
        })
        .join('')
    : '<p class="no-proposals">Вы ещё не отправляли предложений.</p>';
}

// ── Сила пароля ──────────────────────────────────────────────────────────────

const STRENGTH = [
  { width: '0%', color: 'transparent', label: '' },
  { width: '30%', color: '#f97316', label: 'Слабый' },
  { width: '54%', color: '#eab308', label: 'Средний' },
  { width: '76%', color: '#84cc16', label: 'Хороший' },
  { width: '100%', color: '#34d399', label: 'Отличный' },
];

function updateStrength(input) {
  const prefix = input.dataset.strength;
  const level = STRENGTH[passwordStrength(input.value)];
  const fill = $(`${prefix}-fill`);
  fill.style.width = input.value ? level.width : '0%';
  fill.style.background = level.color;
  $(`${prefix}-label`).textContent = input.value ? level.label : '';
}

// ── События ──────────────────────────────────────────────────────────────────

const FORMS = {
  login: doLogin,
  register: doRegister,
  verify: doVerify,
  forgot: doForgot,
  'reset-code': doVerifyReset,
  'new-pass': doNewPassword,
};

const ACTIONS = {
  tab: (name) => showPanel(name),
  show: (name) => showPanel(name),
  resend: doResend,
  logout: doLogout,
  'toggle-pass': (inputId, button) => {
    const input = $(inputId);
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
    button.textContent = visible ? '🙈' : '👁';
  },
};

/** Запускает обработчик и показывает ошибку в баннере его панели вместо тишины. */
function run(task, origin) {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      console.error(error);
      const banner = origin?.closest('[data-panel]')?.querySelector('.status-banner');
      if (banner) setBanner(banner.id, GENERIC_ERROR, 'bad');
    });
}

card.addEventListener('submit', (event) => {
  event.preventDefault();
  const handler = FORMS[event.target.dataset.form];
  if (handler) run(handler, event.target);
});

card.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const [name, arg] = button.dataset.action.split(':');
  if (ACTIONS[name]) run(() => ACTIONS[name](arg, button), button);
});

card.addEventListener('input', (event) => {
  if (event.target.matches('.field input, #r-agree')) clearFieldError(event.target);
  if (event.target.dataset.strength) updateStrength(event.target);
});

card.addEventListener('change', (event) => {
  if (event.target.id === 'r-agree') clearFieldError(event.target);
});

initLayout();
showPanel(getCurrentUser() ? 'profile' : 'login', { focus: false });
