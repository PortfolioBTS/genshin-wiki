import '../styles/main.css';
import '../styles/pages/content.css';
import { initLayout } from '../components/layout.js';
import { BANNERS, PITY } from '../data/content/banners.js';
import characters from '../data/generated/characters.json';
import weapons from '../data/generated/weapons.json';
import { bannerCardHtml, pityHtml } from './content-view.js';

const data = { characters, weapons };
const cards = (list) => list.map((banner) => bannerCardHtml(banner, data)).join('');

initLayout();
document.getElementById('banners-current').innerHTML = cards(BANNERS.current);
document.getElementById('banners-upcoming').innerHTML = cards(BANNERS.upcoming);
document.getElementById('pity').innerHTML = pityHtml(PITY);
