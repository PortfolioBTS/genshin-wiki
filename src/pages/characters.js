import '../styles/main.css';
import { characterCardHtml, characterRowHtml } from '../components/cards.js';
import { allOption, initCatalog, rarityOptions, schemaValues } from '../components/catalog.js';
import { chipGroupHtml, selectFilterHtml } from '../components/chips.js';
import { initLayout } from '../components/layout.js';
import characters from '../data/generated/characters.json';
import { filterCharacters, sortCharacters } from '../lib/filters.js';
import { ELEMENTS, REGIONS, WEAPON_TYPES } from '../lib/labels.js';

const elementOptions = [
  allOption(),
  ...Object.entries(ELEMENTS)
    .filter(([key]) => key !== 'none')
    .map(([value, { label, icon }]) => ({ value, label: `${icon} ${label}` })),
];
const rarities = rarityOptions([4, 5]);
const weaponOptions = [
  allOption('Любое'),
  ...Object.entries(WEAPON_TYPES).map(([value, label]) => ({ value, label })),
];
const regionOptions = [
  allOption('Любой'),
  ...Object.entries(REGIONS).map(([value, label]) => ({ value, label })),
];

const schema = {
  el: { default: 'all', values: schemaValues(elementOptions) },
  rarity: { default: 'all', values: schemaValues(rarities) },
  weapon: { default: 'all', values: schemaValues(weaponOptions) },
  region: { default: 'all', values: schemaValues(regionOptions) },
  sort: { default: 'name', values: ['name', 'new'] },
  q: { default: '' },
};

initLayout();
document.getElementById('filter-groups').innerHTML = [
  chipGroupHtml('el', 'Стихия', elementOptions, 'all'),
  chipGroupHtml('rarity', 'Редкость', rarities, 'all'),
  selectFilterHtml('weapon', 'Оружие', weaponOptions, 'all'),
  selectFilterHtml('region', 'Регион', regionOptions, 'all'),
].join('');

initCatalog({
  schema,
  apply: (state) => sortCharacters(filterCharacters(characters, state), state.sort),
  cardHtml: characterCardHtml,
  rowHtml: characterRowHtml,
  tableHead: ['Персонаж', 'Редкость', 'Стихия', 'Оружие', 'Регион', 'Версия'],
  gridClass: 'cards-grid',
  viewKey: 'gw_view_characters',
});
