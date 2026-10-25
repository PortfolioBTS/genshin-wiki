import '../styles/main.css';
import { artifactCardHtml, artifactRowHtml } from '../components/cards.js';
import { initCatalog, rarityOptions, schemaValues } from '../components/catalog.js';
import { chipGroupHtml } from '../components/chips.js';
import { initLayout } from '../components/layout.js';
import artifacts from '../data/generated/artifacts.json';
import { filterArtifacts } from '../lib/filters.js';

const rarities = rarityOptions([4, 5]);

const schema = {
  rarity: { default: 'all', values: schemaValues(rarities) },
  q: { default: '' },
};

initLayout();
document.getElementById('filter-groups').innerHTML = chipGroupHtml(
  'rarity',
  'Редкость',
  rarities,
  'all',
);

initCatalog({
  schema,
  apply: (state) => filterArtifacts(artifacts, state),
  cardHtml: artifactCardHtml,
  rowHtml: artifactRowHtml,
  tableHead: ['Сет', 'Редкость', 'Бонусы'],
  gridClass: 'wide-grid',
  viewKey: 'gw_view_artifacts',
});
