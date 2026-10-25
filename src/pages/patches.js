import '../styles/main.css';
import '../styles/pages/content.css';
import { initLayout } from '../components/layout.js';
import { PATCHES } from '../data/content/patches.js';
import characters from '../data/generated/characters.json';
import weapons from '../data/generated/weapons.json';
import { patchCardHtml } from './content-view.js';

initLayout();
document.getElementById('patches').innerHTML = PATCHES.map((patch) =>
  patchCardHtml(patch, { characters, weapons }),
).join('');
