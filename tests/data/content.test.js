import { describe, expect, it } from 'vitest';
import characters from '../../src/data/generated/characters.json';
import weapons from '../../src/data/generated/weapons.json';
import { BANNERS, PITY } from '../../src/data/content/banners.js';
import { GUIDE_TAGS, GUIDES } from '../../src/data/content/guides.js';
import { PATCHES } from '../../src/data/content/patches.js';
import { REGIONS_INFO } from '../../src/data/content/regions.js';
import { DATA_AS_OF } from '../../src/data/content/site.js';
import { ELEMENTS, REGIONS } from '../../src/lib/labels.js';
import { compareVersions } from '../../src/lib/versions.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('site', () => {
  it('states the data date', () => {
    expect(DATA_AS_OF).toBe('25.10.2026');
  });
});

describe('patches', () => {
  it('covers 6.0 to 7.1 newest first with ISO dates', () => {
    expect(PATCHES[0].version).toBe('7.1');
    expect(PATCHES.at(-1).version).toBe('6.0');
    expect([...PATCHES].sort((a, b) => compareVersions(b.version, a.version))).toEqual(PATCHES);
    for (const p of PATCHES) {
      expect(p.date).toMatch(ISO_DATE);
      expect(p.title).toBeTruthy();
      expect(p.highlights.length).toBeGreaterThan(0);
    }
  });

  it('has dates that grow with versions', () => {
    const dates = PATCHES.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe('banners', () => {
  const charSlugs = new Set(characters.map((c) => c.slug));
  const weaponSlugs = new Set(weapons.map((w) => w.slug));
  const all = [...BANNERS.current, ...BANNERS.upcoming];

  it('references only existing characters and weapons', () => {
    for (const b of all) {
      for (const slug of [...b.featured5, ...b.featured4]) {
        expect(b.kind === 'weapon' ? weaponSlugs : charSlugs).toContain(slug);
      }
    }
  });

  it('uses known kinds and ISO or null dates', () => {
    for (const b of all) {
      expect(['character', 'weapon', 'chronicled', 'standard']).toContain(b.kind);
      for (const d of [b.start, b.end]) if (d !== null) expect(d).toMatch(ISO_DATE);
    }
  });

  it('has a current banner window and pity rules', () => {
    expect(BANNERS.current.length).toBeGreaterThan(0);
    expect(PITY.length).toBeGreaterThan(0);
    for (const p of PITY) expect(p.label && p.value && p.sub).toBeTruthy();
  });
});

describe('regions', () => {
  it('describes every nation and Nod-Krai with valid slugs and elements', () => {
    const slugs = REGIONS_INFO.map((r) => r.slug);
    expect(slugs.sort()).toEqual(
      Object.keys(REGIONS)
        .filter((s) => s !== 'other')
        .sort(),
    );
    for (const r of REGIONS_INFO) {
      expect(r.element in ELEMENTS).toBe(true);
      expect(r.archon && r.desc && r.nation).toBeTruthy();
    }
  });
});

describe('guides', () => {
  it('uses only known tags', () => {
    expect(GUIDES.every((g) => GUIDE_TAGS.includes(g.tag))).toBe(true);
  });
});
