// Минимальные объекты в форме ответов genshin-db (ru — resultLanguage: 'Russian').

export const skirkEn = {
  name: 'Skirk',
  elementType: 'ELEMENT_CRYO',
  weaponType: 'WEAPON_SWORD_ONE_HAND',
  associationType: 'ASSOC_OMNI_SCOURGE',
};

export const skirkRu = {
  name: 'Скирк',
  title: 'Звезда пустоты',
  description: 'Путница, однажды появившаяся в разломе Бездны.',
  rarity: 5,
  birthday: '5 ноября',
  affiliation: 'Космический катаклизм',
  substatText: 'Крит. урон',
  constellation: 'Кристаллина',
  version: '5.7',
  images: {
    filename_icon: 'UI_AvatarIcon_SkirkNew',
    filename_gachaSplash: 'UI_Gacha_AvatarImg_SkirkNew',
  },
  costs: {
    ascend1: [
      { name: 'Мора', count: 20000 },
      { name: 'Осколок нефрита Шивада', count: 1 },
    ],
    ascend2: [
      { name: 'Мора', count: 40000 },
      { name: 'Фрагмент нефрита Шивада', count: 3 },
    ],
  },
};

export const skirkTalents = {
  combat1: { name: 'Хаос: Раскол', description: 'Обычная атака:\nДо пяти ударов.' },
  combat2: { name: 'Навык', description: 'Наносит **Крио** урон.' },
  combat3: { name: 'Взрыв', description: 'Большой урон.' },
  passive1: { name: 'Разум за гранью разума', description: 'Пассивка 1.' },
  passive2: { name: 'Пассивка 2', description: 'Текст.' },
  costs: {},
};

export const skirkConstellations = Object.fromEntries(
  [1, 2, 3, 4, 5, 6].map((n) => [`c${n}`, { name: `Созвездие ${n}`, description: `Эффект ${n}` }]),
);

export const lumineEn = {
  name: 'Lumine',
  elementType: 'ELEMENT_NONE',
  weaponType: 'WEAPON_SWORD_ONE_HAND',
  associationType: 'ASSOC_MAINACTOR',
};

export const lumineRu = {
  name: 'Люмин',
  title: '',
  description: 'Путешественница из другого мира.',
  rarity: 5,
  substatText: 'Сила атаки',
  version: '1.0',
  images: {
    filename_icon: 'UI_AvatarIcon_PlayerGirl',
    filename_gachaSplash: 'UI_Gacha_AvatarImg_PlayerGirl',
  },
  costs: {},
};

export const mistsplitterEn = {
  name: 'Mistsplitter Reforged',
  weaponType: 'WEAPON_SWORD_ONE_HAND',
  mainStatType: 'FIGHT_PROP_CRITICAL_HURT',
};

export const mistsplitterRu = {
  name: 'Рассекающий туман',
  rarity: 5,
  mainStatText: 'Крит. урон',
  effectName: 'Лезвие рассекателя тумана',
  r1: {
    description: 'Все типы элементального урона получают <color=#99FFFFFF>12%</color> бонуса.',
  },
  images: { filename_icon: 'UI_EquipIcon_Sword_Narukami' },
  version: '2.0',
};

export const mistsplitterStats90 = { attack: 674.3345, specialized: 0.441024 };

export const gladiatorEn = { name: "Gladiator's Finale" };

export const gladiatorRu = {
  name: 'Конец гладиатора',
  rarityList: [4, 5],
  effect2Pc: 'Увеличивает силу атаки на 18%.',
  effect4Pc: 'Увеличивает урон обычной атаки на 35%.',
  images: { filename_flower: 'UI_RelicIcon_15001_4', filename_circlet: 'UI_RelicIcon_15001_3' },
  version: '1.0',
};

export const shamanEn = { name: 'Prayers for Wisdom' };

export const shamanRu = {
  name: 'Шаман воды',
  rarityList: [3, 4],
  effect1Pc: 'Уменьшает длительность Электро эффекта на 40%.',
  images: { filename_circlet: 'UI_RelicIcon_X_3' },
  version: '1.0',
};
