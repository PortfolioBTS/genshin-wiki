// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mountProposalForm } from '../../src/components/proposal-form.js';

const OPTIONS = {
  page: 'Персонажи',
  title: 'Предложить информацию о персонаже',
  intro: 'Нашли ошибку?',
  categories: ['Ошибка в описании', 'Другое'],
  itemPlaceholder: 'Имя персонажа',
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const toast = () => document.getElementById('toast')?.textContent;
const stored = () => JSON.parse(localStorage.getItem('gw_proposals') ?? '[]');

let container;

beforeEach(() => {
  document.body.innerHTML = '<section id="wrap"></section>';
  container = document.getElementById('wrap');
});

afterEach(() => localStorage.clear());

describe('mountProposalForm', () => {
  it('asks guests to log in', () => {
    mountProposalForm(container, OPTIONS);
    expect(container.querySelector('a[href="auth.html"]')).not.toBeNull();
    expect(container.querySelector('form')).toBeNull();
    expect(container.textContent).toContain(OPTIONS.title);
  });

  describe('for a logged-in user', () => {
    beforeEach(() => {
      localStorage.setItem('gw_user', JSON.stringify({ name: '<b>Аня</b>', email: 'a@b.c' }));
      mountProposalForm(container, OPTIONS);
    });

    it('shows the form with escaped name, categories and a demo note', () => {
      expect(container.innerHTML).toContain('&lt;b&gt;Аня&lt;/b&gt;');
      const options = [...container.querySelectorAll('select option')].map((o) => o.textContent);
      expect(options).toContain('Ошибка в описании');
      expect(container.querySelector('.demo-note').textContent).toContain(
        'сохраняются в этом браузере',
      );
    });

    it('validates category and text before saving', async () => {
      container.querySelector('form').requestSubmit();
      expect(toast()).toBe('Выберите категорию');
      container.querySelector('select').value = 'Другое';
      container.querySelector('form').requestSubmit();
      expect(toast()).toBe('Введите описание предложения');
      expect(stored()).toHaveLength(0);
    });

    it('saves a valid proposal and clears the form', async () => {
      container.querySelector('select').value = 'Другое';
      container.querySelector('input').value = 'Скирк';
      container.querySelector('textarea').value = '  Текст  ';
      container.querySelector('form').requestSubmit();
      await flush();
      expect(stored()).toEqual([
        expect.objectContaining({
          user: 'a@b.c',
          page: 'Персонажи',
          cat: 'Другое',
          item: 'Скирк',
          text: 'Текст',
        }),
      ]);
      expect(container.querySelector('textarea').value).toBe('');
      expect(toast()).toBe('✓ Предложение сохранено локально (демо-режим)');
      expect(container.querySelector('button[type="submit"]').disabled).toBe(false);
    });
  });
});
