// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  imageHtml,
  installImageFallbacks,
  placeholderHtml,
} from '../../src/components/game-image.js';
import { iconUrls } from '../../src/lib/images.js';

describe('iconUrls', () => {
  it('lists HoYoLAB first and enka.network second for characters', () => {
    expect(iconUrls('character', 'UI_AvatarIcon_X')).toEqual([
      'https://upload-os-bbs.mihoyo.com/game_record/genshin/character_icon/UI_AvatarIcon_X.png',
      'https://enka.network/ui/UI_AvatarIcon_X.png',
    ]);
  });

  it('uses the equip folder for weapons and artifacts', () => {
    expect(iconUrls('weapon', 'W')[0]).toBe(
      'https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/W.png',
    );
    expect(iconUrls('artifact', 'A')[0]).toBe(
      'https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/A.png',
    );
  });

  it('uses only enka.network for splash art', () => {
    expect(iconUrls('splash', 'S')).toEqual(['https://enka.network/ui/S.png']);
  });

  it('returns nothing for an empty file name', () => {
    expect(iconUrls('character', '')).toEqual([]);
  });
});

describe('image fallbacks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('walks through every source and ends on a placeholder', () => {
    document.body.innerHTML = imageHtml({
      kind: 'character',
      file: 'UI_AvatarIcon_X',
      alt: 'Скирк',
      fallbackText: 'Скирк',
      className: 'el-cryo',
    });
    installImageFallbacks();
    installImageFallbacks();
    const img = () => document.querySelector('img');
    expect(img().getAttribute('loading')).toBe('lazy');
    expect(img().alt).toBe('Скирк');
    expect(img().src).toContain('upload-os-bbs.mihoyo.com');

    img().dispatchEvent(new Event('error'));
    expect(img().src).toBe('https://enka.network/ui/UI_AvatarIcon_X.png');

    img().dispatchEvent(new Event('error'));
    expect(document.querySelector('img')).toBeNull();
    const ph = document.querySelector('.img-ph.el-cryo');
    expect(ph.textContent).toBe('С');
  });

  it('renders a placeholder right away when there is no file', () => {
    expect(imageHtml({ kind: 'character', file: '', alt: 'A', fallbackText: 'Альбедо' })).toContain(
      'img-ph',
    );
  });

  it('escapes attribute values', () => {
    const html = imageHtml({ kind: 'weapon', file: 'f', alt: '"><script>', fallbackText: 'x' });
    expect(html).not.toContain('<script>');
  });

  it('builds a placeholder with the first letter', () => {
    expect(placeholderHtml('ёж', 'big')).toBe(
      '<span class="img-ph big" aria-hidden="true">Ё</span>',
    );
  });
});
