import type { ApartmentModel } from '../model/types.ts';
import { CEILING_HEIGHT, createModelBuilder } from './core/builder.ts';
import { createMaterials } from './core/materials.ts';
import { buildFloors } from './shell/floors.ts';
import { buildWalls } from './shell/walls.ts';
import { buildCeiling } from './shell/ceiling.ts';
import { buildLivingRoom } from './rooms/living-room.ts';
import { buildKitchen } from './rooms/kitchen.ts';
import { buildStudy } from './rooms/study.ts';
import { buildHall } from './rooms/hall.ts';
import { buildMainBathroom } from './rooms/main-bathroom.ts';
import { buildEnsuite } from './rooms/ensuite.ts';
import { buildCloakroom } from './rooms/cloakroom.ts';
import { buildBedroom } from './rooms/bedroom.ts';

/** Pure model construction, shared by the Node CLI and future browser editing. */
export function buildApartment(): ApartmentModel {
  const model = createModelBuilder();
  // Keep source ordering during migration so each detail can be compared to the baseline.
  buildFloors(model);
  buildWalls(model);
  buildLivingRoom(model);
  buildKitchen(model);
  buildStudy(model);
  buildHall(model);
  buildMainBathroom(model);
  buildEnsuite(model);
  buildCloakroom(model);
  buildBedroom(model);
  buildCeiling(model);
  return {
    metadata: {
      title: 'Квартира по фотографии планировки',
      units: 'metres',
      ceilingHeight: CEILING_HEIGHT,
      coordinateSystem: 'X right, Y up, Z down the source plan',
      source: 'User-supplied photographed plan',
      status:
        'Approximate reconstruction; readable dimensions prioritized; unlabelled values inferred',
    },
    materials: createMaterials(),
    parts: model.parts,
    labels: [
      ['Кухня-гостиная', 3.7, 1.85],
      ['Кабинет', 8.12, 0.66],
      ['Спальня', 8.35, 4.21],
      ['Санузел', 0.93, 4.22],
      ['Санузел', 5.65, 5.56],
      ['Гардеробная', 1.08, 7.13],
      ['Прихожая', 2.45, 6.43],
      ['Холл', 4.31, 4.76],
      ['Балкон', 10.71, 5.24],
    ],
  };
}
