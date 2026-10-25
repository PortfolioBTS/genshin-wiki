// Картинки грузятся напрямую с внешних хостов: сначала официальный CDN
// HoYoLAB, затем зеркало enka.network. Если не загрузится ни одна, компонент
// game-image покажет заглушку.

const HOYOLAB = 'https://upload-os-bbs.mihoyo.com/game_record/genshin';
const ENKA = 'https://enka.network/ui';

const PRIMARY = {
  character: (file) => `${HOYOLAB}/character_icon/${file}.png`,
  weapon: (file) => `${HOYOLAB}/equip/${file}.png`,
  artifact: (file) => `${HOYOLAB}/equip/${file}.png`,
};

export function iconUrls(kind, file) {
  if (!file) return [];
  const enka = `${ENKA}/${file}.png`;
  const primary = PRIMARY[kind];
  return primary ? [primary(file), enka] : [enka];
}
