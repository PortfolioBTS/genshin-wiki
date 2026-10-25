import '../styles/main.css';
import '../styles/pages/content.css';
import { initLayout } from '../components/layout.js';
import { REGIONS_INFO } from '../data/content/regions.js';
import characters from '../data/generated/characters.json';
import { regionCardHtml } from './content-view.js';

const counts = {};
for (const { region } of characters) counts[region] = (counts[region] ?? 0) + 1;

initLayout();
document.getElementById('regions').innerHTML = REGIONS_INFO.map((region) =>
  regionCardHtml(region, counts[region.slug] ?? 0),
).join('');
