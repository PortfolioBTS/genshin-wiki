import '../styles/main.css';
import '../styles/pages/content.css';
import { allOption } from '../components/catalog.js';
import { bindChips, chipGroupHtml, syncChips } from '../components/chips.js';
import { initLayout } from '../components/layout.js';
import { mountProposalForm } from '../components/proposal-form.js';
import { GUIDE_TAGS, GUIDES } from '../data/content/guides.js';
import { parseQuery, toQuery } from '../lib/url-state.js';
import { guideCardHtml } from './content-view.js';

const options = [allOption(), ...GUIDE_TAGS.map((tag) => ({ value: tag, label: tag }))];
const schema = { tag: { default: 'all', values: options.map((o) => o.value) } };
const state = parseQuery(location.search, schema);

const filters = document.getElementById('guide-filters');
const list = document.getElementById('guides');

function render() {
  const guides = state.tag === 'all' ? GUIDES : GUIDES.filter((g) => g.tag === state.tag);
  list.innerHTML = guides.map(guideCardHtml).join('');
}

initLayout();
filters.innerHTML = chipGroupHtml('tag', 'Категория', options, state.tag);
bindChips(filters, (name, value) => {
  state[name] = value;
  history.replaceState(null, '', toQuery(state, schema) || location.pathname);
  syncChips(filters, state);
  render();
});
render();

mountProposalForm(document.getElementById('submit-wrap'), {
  page: 'Гайды',
  title: 'Предложить гайд или дополнение',
  intro: 'Поделитесь опытом с сообществом.',
  categories: [
    'Новый гайд',
    'Дополнение к существующему гайду',
    'Ошибка или устаревшая информация',
    'Другое',
  ],
  itemPlaceholder: 'Название гайда или раздела',
});
