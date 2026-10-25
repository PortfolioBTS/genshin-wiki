// @vitest-environment jsdom
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyPartials } from '../../build/partials-plugin.js';

const root = process.cwd();
const partials = Object.fromEntries(
  readdirSync(join(root, 'partials')).map((f) => [
    f.replace('.html', ''),
    readFileSync(join(root, 'partials', f), 'utf8'),
  ]),
);
const html = applyPartials(readFileSync(join(root, 'auth.html'), 'utf8'), {
  partials,
  page: 'auth.html',
});

const $ = (id) => document.getElementById(id);
const visiblePanel = () => document.querySelector('[data-panel]:not([hidden])').dataset.panel;
const waitFor = async (check) => {
  for (let i = 0; i < 200; i++) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('timed out');
};

async function openPage() {
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
  vi.resetModules();
  await import('../../src/pages/auth.js');
}

function fill(values) {
  for (const [id, value] of Object.entries(values)) {
    const input = $(id);
    if (input.type === 'checkbox') input.checked = value;
    else input.value = value;
  }
}

const submit = (form) =>
  document
    .querySelector(`form[data-form="${form}"]`)
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('auth page', () => {
  it('opens on the login panel without stealing focus', async () => {
    await openPage();
    expect(visiblePanel()).toBe('login');
    expect(document.activeElement.tagName).not.toBe('INPUT');
  });

  it('refuses to report success when storage is blocked', async () => {
    await openPage();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    $('auth-tabs').querySelector('[data-action="tab:register"]').click();
    fill({
      'r-name': 'Аня',
      'r-email': 'a@b.cd',
      'r-pass': 'secret123',
      'r-pass2': 'secret123',
      'r-agree': true,
    });
    submit('register');
    await waitFor(() => /\d{6}/.test($('verify-banner').textContent));
    const code = $('verify-banner').textContent.match(/\d{6}/)[0];
    [...document.querySelectorAll('#verify-code input')].forEach((input, i) => {
      input.value = code[i];
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await waitFor(() => $('verify-banner').textContent.includes('Хранилище'));
    expect($('verify-banner').textContent).toContain('Хранилище браузера недоступно');
    expect(visiblePanel()).toBe('verify');
    expect($('auth-btn').textContent).toBe('Войти');
  }, 15000);

  it('shows an error instead of failing silently on a corrupted account', async () => {
    localStorage.setItem(
      'gw_users',
      JSON.stringify([{ email: 'a@b.cd', name: 'A', hash: 'x', salt: 'a', verified: true }]),
    );
    await openPage();
    fill({ 'l-email': 'a@b.cd', 'l-pass': 'secret123' });
    submit('login');
    await waitFor(() => $('login-banner').textContent);
    expect($('login-banner').textContent).toContain('Что-то пошло не так');
  });
});
