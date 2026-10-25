import { describe, expect, it } from 'vitest';
import {
  assertUniqueSlugs,
  buildSearchIndex,
  cleanText,
  formatSubstat,
  mapElement,
  mapRegion,
  mapWeapon,
  slugify,
  sumCosts,
  toArtifact,
  toCharacterDetail,
  toCharacterSummary,
  toTraveler,
  toWeapon,
} from '../../scripts/data/transform.mjs';
import * as f from './fixtures.js';

describe('slugify', () => {
  it('builds URL-safe slugs from English names', () => {
    expect(slugify('Hu Tao')).toBe('hu-tao');
    expect(slugify("Gladiator's Finale")).toBe('gladiator-s-finale');
    expect(slugify('  Kaedehara  Kazuha ')).toBe('kaedehara-kazuha');
    expect(slugify('Pokémon')).toBe('pokemon');
  });
});

describe('mappers', () => {
  it('maps elements, treating none and empty as none', () => {
    expect(mapElement('ELEMENT_PYRO')).toBe('pyro');
    expect(mapElement('ELEMENT_NONE')).toBe('none');
    expect(mapElement(undefined)).toBe('none');
  });

  it('maps weapons and rejects unknown types', () => {
    expect(mapWeapon('WEAPON_POLE')).toBe('polearm');
    expect(mapWeapon('WEAPON_SWORD_ONE_HAND')).toBe('sword');
    expect(() => mapWeapon('WEAPON_GUN')).toThrow('Unknown weaponType WEAPON_GUN');
  });

  it('maps regions including special associations', () => {
    expect(mapRegion('ASSOC_MONDSTADT', 'Diluc')).toBe('mondstadt');
    expect(mapRegion('ASSOC_NODKRAI_ZIBAI', 'Zibai')).toBe('liyue');
    expect(mapRegion('ASSOC_FATUI', 'Tartaglia')).toBe('snezhnaya');
    expect(mapRegion('ASSOC_SNEZHNAYA_STAR', 'Vesna')).toBe('snezhnaya');
    expect(mapRegion('ASSOC_OMNI_SCOURGE', 'Skirk')).toBe('other');
  });

  it('fails loudly on an unknown association', () => {
    expect(() => mapRegion('ASSOC_NEW', 'X')).toThrow('Unknown associationType ASSOC_NEW for X');
  });
});

describe('cleanText', () => {
  it('strips game tags, escapes, and converts bold and newlines', () => {
    expect(cleanText('<color=#FFD780FF>Огонь</color> **Удар**\n<script>')).toBe(
      'Огонь <b class="hl">Удар</b><br>',
    );
  });

  it('escapes stray angle brackets that are not tags', () => {
    expect(cleanText('HP < 50% & "x"')).toBe('HP &lt; 50% &amp; &quot;x&quot;');
  });

  it('drops leftover asterisks from nested bold markers', () => {
    expect(cleanText('**Благодатью кенозиса******, повышая силу')).toBe(
      '<b class="hl">Благодатью кенозиса</b>, повышая силу',
    );
  });

  it('returns an empty string for missing text', () => {
    expect(cleanText(undefined)).toBe('');
  });
});

describe('formatSubstat', () => {
  it('formats percentages with a decimal comma', () => {
    expect(formatSubstat('FIGHT_PROP_CRITICAL_HURT', 0.441024)).toBe('44,1%');
    expect(formatSubstat('FIGHT_PROP_ATTACK_PERCENT', 0.1)).toBe('10,0%');
  });

  it('formats elemental mastery as a whole number', () => {
    expect(formatSubstat('FIGHT_PROP_ELEMENT_MASTERY', 165.4)).toBe('165');
  });

  it('returns null without a stat', () => {
    expect(formatSubstat(undefined, undefined)).toBeNull();
  });
});

describe('sumCosts', () => {
  it('sums materials across ascension phases in first-seen order', () => {
    expect(
      sumCosts({
        ascend1: [
          { name: 'Мора', count: 20000 },
          { name: 'X', count: 1 },
        ],
        ascend2: [{ name: 'Мора', count: 40000 }],
      }),
    ).toEqual([
      { name: 'Мора', count: 60000 },
      { name: 'X', count: 1 },
    ]);
  });

  it('handles missing costs', () => {
    expect(sumCosts(undefined)).toEqual([]);
  });
});

describe('toCharacterSummary', () => {
  it('builds the catalog entry', () => {
    expect(toCharacterSummary(f.skirkRu, f.skirkEn)).toEqual({
      slug: 'skirk',
      name: 'Скирк',
      title: 'Звезда пустоты',
      rarity: 5,
      element: 'cryo',
      weapon: 'sword',
      region: 'other',
      birthday: '5 ноября',
      constellation: 'Кристаллина',
      version: '5.7',
      icon: 'UI_AvatarIcon_SkirkNew',
    });
  });
});

describe('toCharacterDetail', () => {
  const detail = toCharacterDetail(f.skirkRu, f.skirkEn, f.skirkTalents, f.skirkConstellations);

  it('keeps talents in game order with kinds and cleaned HTML', () => {
    expect(detail.talents.map((t) => [t.kind, t.name])).toEqual([
      ['combat', 'Хаос: Раскол'],
      ['combat', 'Навык'],
      ['combat', 'Взрыв'],
      ['passive', 'Разум за гранью разума'],
      ['passive', 'Пассивка 2'],
    ]);
    expect(detail.talents[1].html).toBe('Наносит <b class="hl">Крио</b> урон.');
  });

  it('lists six constellations and summed materials', () => {
    expect(detail.constellations.map((c) => c.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(detail.materials[0]).toEqual({ name: 'Мора', count: 60000 });
    expect(detail).toMatchObject({
      slug: 'skirk',
      affiliation: 'Космический катаклизм',
      ascensionStat: 'Крит. урон',
      splash: 'UI_Gacha_AvatarImg_SkirkNew',
    });
  });

  it('skips empty talent and constellation slots without a name', () => {
    const detail = toCharacterDetail(
      f.skirkRu,
      f.skirkEn,
      { ...f.skirkTalents, combatsp: {} },
      { ...f.skirkConstellations, c6: { description: '' } },
    );
    expect(detail.talents.every((t) => t.name)).toBe(true);
    expect(detail.talents).toHaveLength(5);
    expect(detail.constellations.map((c) => c.level)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns empty lists when talents and constellations are missing', () => {
    const empty = toCharacterDetail(f.lumineRu, f.lumineEn, null, null);
    expect(empty.talents).toEqual([]);
    expect(empty.constellations).toEqual([]);
  });
});

describe('toTraveler', () => {
  it('merges the twins into one neutral entry', () => {
    const { summary, detail } = toTraveler(f.lumineRu, f.lumineEn);
    expect(summary).toMatchObject({
      slug: 'traveler',
      name: 'Путешественник',
      element: 'none',
      weapon: 'sword',
      rarity: 5,
      region: 'other',
      version: '1.0',
      icon: 'UI_AvatarIcon_PlayerGirl',
    });
    expect(detail).toMatchObject({
      slug: 'traveler',
      talents: [],
      constellations: [],
      materials: [],
    });
  });
});

describe('toWeapon', () => {
  it('builds a weapon entry with formatted stats', () => {
    expect(toWeapon(f.mistsplitterRu, f.mistsplitterEn, f.mistsplitterStats90)).toEqual({
      slug: 'mistsplitter-reforged',
      name: 'Рассекающий туман',
      type: 'sword',
      rarity: 5,
      baseAtk: 674,
      substat: { label: 'Крит. урон', value: '44,1%' },
      passive: {
        name: 'Лезвие рассекателя тумана',
        html: 'Все типы элементального урона получают 12% бонуса.',
      },
      icon: 'UI_EquipIcon_Sword_Narukami',
      version: '2.0',
    });
  });

  it('uses null for a missing substat or passive', () => {
    const plain = toWeapon(
      { ...f.mistsplitterRu, effectName: undefined, r1: undefined, mainStatText: undefined },
      { ...f.mistsplitterEn, mainStatType: undefined },
      { attack: 40.2 },
    );
    expect(plain.substat).toBeNull();
    expect(plain.passive).toBeNull();
  });
});

describe('toArtifact', () => {
  it('builds a set with 2 and 4 piece bonuses', () => {
    expect(toArtifact(f.gladiatorRu, f.gladiatorEn)).toEqual({
      slug: 'gladiator-s-finale',
      name: 'Конец гладиатора',
      rarity: 5,
      bonus1: null,
      bonus2: 'Увеличивает силу атаки на 18%.',
      bonus4: 'Увеличивает урон обычной атаки на 35%.',
      icon: 'UI_RelicIcon_15001_4',
      version: '1.0',
    });
  });

  it('handles one-piece sets that only have a circlet', () => {
    expect(toArtifact(f.shamanRu, f.shamanEn)).toMatchObject({
      slug: 'prayers-for-wisdom',
      rarity: 4,
      bonus1: 'Уменьшает длительность Электро эффекта на 40%.',
      bonus2: null,
      bonus4: null,
      icon: 'UI_RelicIcon_X_3',
    });
  });
});

describe('buildSearchIndex', () => {
  it('flattens all lists with their type', () => {
    const index = buildSearchIndex({
      characters: [{ slug: 'skirk', name: 'Скирк', icon: 'a' }],
      weapons: [{ slug: 'w', name: 'W', icon: 'b' }],
      artifacts: [{ slug: 'g', name: 'G', icon: 'c' }],
    });
    expect(index).toEqual([
      { type: 'character', slug: 'skirk', name: 'Скирк', icon: 'a' },
      { type: 'weapon', slug: 'w', name: 'W', icon: 'b' },
      { type: 'artifact', slug: 'g', name: 'G', icon: 'c' },
    ]);
  });
});

describe('assertUniqueSlugs', () => {
  it('names both entries of a duplicate slug', () => {
    expect(() =>
      assertUniqueSlugs(
        [
          { slug: 'a', name: 'A' },
          { slug: 'a', name: 'B' },
        ],
        'characters',
      ),
    ).toThrow(/A.*B/);
  });

  it('passes unique lists', () => {
    expect(() => assertUniqueSlugs([{ slug: 'a', name: 'A' }], 'x')).not.toThrow();
  });
});
