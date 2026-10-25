// Источники:
// - https://game8.co/games/Genshin-Impact/archives/305012 (расписание баннеров, октябрь 2026)
// - https://gamesandchill.com/en/news/genshin-impact-7-1-phase-ii-banners-bring-back-skirk-and-escoffier/
// - https://www.prydwen.gg/genshin-impact/banners
// - https://www.siliconera.com/7-2-genshin-impact-update-adds-mitya-and-valeriy-in-november/
// - https://www.sportskeeda.com/esports/genshin-impact-7-2-livestream-summary-new-characters-map-redemption-codes
// - https://gamewith.net/genshin-impact/article/show/47800 и https://news.codashop.com/ph/?p=29122 (гарантия)
// featured5/featured4 — slug'и из сгенерированных данных (для kind: 'weapon' — оружия).

const PHASE_7_1_2 = { start: '2026-10-13', end: '2026-11-03' };
const RATE_UP_4 = ['dahlia', 'candace', 'mika'];

export const BANNERS = {
  current: [
    {
      title: 'Повторный баннер Скирк',
      kind: 'character',
      featured5: ['skirk'],
      featured4: RATE_UP_4,
      ...PHASE_7_1_2,
    },
    {
      title: 'Повторный баннер Эскофье',
      kind: 'character',
      featured5: ['escoffier'],
      featured4: RATE_UP_4,
      ...PHASE_7_1_2,
    },
    {
      title: 'Молитва эпитомии: сигнатурное оружие Скирк и Эскофье',
      kind: 'weapon',
      featured5: ['azurelight', 'symphonist-of-scents'],
      featured4: [],
      ...PHASE_7_1_2,
    },
  ],
  upcoming: [
    {
      title: 'Версия 7.2: Митя (5★ Электро, катализатор) и Валерий (4★ Электро, двуручный меч)',
      kind: 'character',
      featured5: [],
      featured4: [],
      start: '2026-11-04',
      end: null,
    },
    {
      title: 'Версия 7.2: повторный баннер Фурины (по предварительным данным)',
      kind: 'character',
      featured5: ['furina'],
      featured4: [],
      start: '2026-11-04',
      end: null,
    },
    {
      title: 'Версия 7.2: Хроники молитв Натлана',
      kind: 'chronicled',
      featured5: ['varesa', 'chasca', 'xilonen', 'mualani', 'kinich'],
      featured4: [],
      start: null,
      end: null,
    },
  ],
};

export const PITY = [
  {
    label: 'Гарантия 5★',
    value: '90',
    sub: 'Не позже 90-й молитвы на баннере персонажа выпадает 5★ (на оружейном — не позже 80-й).',
  },
  {
    label: 'Базовый шанс 5★',
    value: '0,6%',
    sub: 'Шанс на каждую молитву баннера персонажа до того, как он начинает расти.',
  },
  {
    label: 'Рост шанса',
    value: '≈74',
    sub: 'Неофициально: по наблюдениям игроков шанс 5★ заметно растёт примерно с 74-й молитвы.',
  },
  {
    label: 'Система 50/50',
    value: '50%',
    sub: 'Первый 5★ на баннере события — персонаж баннера с шансом 50%. Если нет, следующий 5★ гарантированно будет им.',
  },
  {
    label: 'Захват сияния',
    value: '+',
    sub: 'Capturing Radiance: с версии 5.0 при проигрыше 50/50 есть небольшой шанс всё же получить персонажа баннера. Не действует на оружейном и стандартном баннерах.',
  },
  {
    label: 'Гарантия 4★',
    value: '10',
    sub: 'Каждые 10 молитв гарантируют предмет 4★ или выше.',
  },
];
