// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { initLayout } from '../../src/components/layout.js';

const SHELL =
  '<button id="nav-toggle" aria-expanded="false"></button><a id="auth-btn">Войти</a><span data-as-of></span>';

afterEach(() => {
  localStorage.clear();
  document.body.className = '';
});

describe('initLayout', () => {
  it('shows the logged-in user name as text', () => {
    document.body.innerHTML = SHELL;
    localStorage.setItem('gw_user', JSON.stringify({ name: '<b>Аня</b>', email: 'a@b.c' }));
    initLayout();
    const btn = document.getElementById('auth-btn');
    expect(btn.textContent).toBe('👤 <b>Аня</b>');
    expect(btn.querySelector('b')).toBeNull();
  });

  it('keeps the login label for guests', () => {
    document.body.innerHTML = SHELL;
    initLayout();
    expect(document.getElementById('auth-btn').textContent).toBe('Войти');
  });

  it('toggles the mobile menu and closes it with Escape', () => {
    document.body.innerHTML = SHELL;
    initLayout();
    const toggle = document.getElementById('nav-toggle');
    toggle.click();
    expect(document.body.classList.contains('nav-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.body.classList.contains('nav-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('fills in the data date', () => {
    document.body.innerHTML = SHELL;
    initLayout();
    expect(document.querySelector('[data-as-of]').textContent).toBe('25.10.2026');
  });
});
