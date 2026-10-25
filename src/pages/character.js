import '../styles/main.css';
import '../styles/pages/character.css';
import { initLayout } from '../components/layout.js';
import characters from '../data/generated/characters.json';
import { findCharacter, initTabs, renderCharacter, renderNotFound } from './character-view.js';

// Подробности каждого персонажа лежат в отдельном чанке и грузятся по требованию.
const details = import.meta.glob('../data/generated/characters/*.json', { import: 'default' });

async function main() {
  initLayout();
  const root = document.getElementById('character');
  const summary = findCharacter(characters, new URLSearchParams(location.search).get('id'));
  const load = summary && details[`../data/generated/characters/${summary.slug}.json`];
  if (!load) {
    root.innerHTML = renderNotFound();
    document.title = 'Персонаж не найден — Genshin Wiki';
    return;
  }
  root.innerHTML = renderCharacter(summary, await load());
  document.title = `${summary.name} — Genshin Wiki`;
  initTabs(root);
}

main();
