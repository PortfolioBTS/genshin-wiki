import '../styles/main.css';
import '../styles/pages/content.css';
import { initLayout } from '../components/layout.js';
import { mountProposalForm } from '../components/proposal-form.js';
import { PATCHES } from '../data/content/patches.js';
import characters from '../data/generated/characters.json';
import weapons from '../data/generated/weapons.json';
import { patchCardHtml } from './content-view.js';

initLayout();
document.getElementById('patches').innerHTML = PATCHES.map((patch) =>
  patchCardHtml(patch, { characters, weapons }),
).join('');

mountProposalForm(document.getElementById('submit-wrap'), {
  page: 'Патчноуты',
  title: 'Предложить правку в патчноуте',
  intro: 'Знаете о новом обновлении или нашли неточность?',
  categories: [
    'Новый патчноут (версия)',
    'Ошибка в описании обновления',
    'Добавить пункт в патчноут',
    'Другое',
  ],
  itemPlaceholder: 'Номер версии, например 7.2',
});
