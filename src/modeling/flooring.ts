import type { ModelFlooring } from '../model/flooring-types.ts';
import { FLOOR_COMPARISON_FORMATS } from '../model/flooring-presets.ts';

export type FloorSurfaceId =
  'apartment-main' | 'main-bathroom' | 'ensuite' | 'entrance-inlay' | 'balcony';

/** User decisions only; no textures, geometry or material overrides yet. */
export function createFlooring(): ModelFlooring {
  const coveringId = 'wood-effect-porcelain';
  const sharedSource = 'Указание пользователя 2026-09-30: общий пол, кроме малого санузла';
  return {
    version: 1,
    status: 'draft',
    coverings: [
      {
        id: coveringId,
        label: 'Керамогранит под дерево',
        kind: 'porcelain-stoneware',
        appearance: 'wood-effect',
        source: 'Рендер кухни пользователя 2026-09-30; товар и точный оттенок не определены',
        formats: FLOOR_COMPARISON_FORMATS.map((format) => ({ ...format })),
        layout: {},
      },
    ],
    surfaces: [
      { id: 'apartment-main', label: 'Основной пол квартиры', coveringId, source: sharedSource },
      { id: 'main-bathroom', label: 'Большой санузел', coveringId, source: sharedSource },
      { id: 'entrance-inlay', label: 'Участок прихожей', coveringId, source: sharedSource },
      {
        id: 'ensuite',
        label: 'Малый санузел при спальне',
        coveringId: null,
        source:
          'Уточнение пользователя 2026-09-30: исключение — весь малый санузел; покрытие не выбрано',
      },
      {
        id: 'balcony',
        label: 'Балкон',
        coveringId: null,
        source: 'Покрытие балкона пока не согласовано',
      },
    ],
  };
}
