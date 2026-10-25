import '../styles/main.css';
import { weaponCardHtml, weaponRowHtml } from '../components/cards.js';
import { allOption, initCatalog, rarityOptions, schemaValues } from '../components/catalog.js';
import { chipGroupHtml } from '../components/chips.js';
import { initLayout } from '../components/layout.js';
import weapons from '../data/generated/weapons.json';
import { filterWeapons } from '../lib/filters.js';
import { WEAPON_TYPES } from '../lib/labels.js';

const typeOptions = [
  allOption(),
  ...Object.entries(WEAPON_TYPES).map(([value, label]) => ({ value, label })),
];
const rarities = rarityOptions([3, 4, 5]);

const schema = {
  type: { default: 'all', values: schemaValues(typeOptions) },
  rarity: { default: 'all', values: schemaValues(rarities) },
  q: { default: '' },
};

initLayout();
document.getElementById('filter-groups').innerHTML = [
  chipGroupHtml('type', 'Тип', typeOptions, 'all'),
  chipGroupHtml('rarity', 'Редкость', rarities, 'all'),
].join('');

initCatalog({
  schema,
  apply: (state) => filterWeapons(weapons, state),
  cardHtml: weaponCardHtml,
  rowHtml: weaponRowHtml,
  tableHead: ['Оружие', 'Тип', 'Редкость', 'Атака', 'Доп. стат', 'Пассивка (R1)'],
  gridClass: 'wide-grid',
  viewKey: 'gw_view_weapons',
});
