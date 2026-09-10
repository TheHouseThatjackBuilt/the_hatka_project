import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { plant } from '../furniture/plant.ts';
import { chair } from '../furniture/seating.ts';
import { PLAN } from '../plan.ts';

export function buildBedroom(model: ModelBuilder) {
  const { box, ellipsoid, cylinder } = model;
  const { bed, bedside, northStorage, desk } = PLAN.bedroom;
  box('Bed frame', bed.x, bed.z, bed.width, bed.length, 0.28, 'oak', 0.11);
  box(
    'Bed mattress',
    bed.x + 0.03,
    bed.z + 0.03,
    bed.width - 0.06,
    bed.length - 0.105,
    0.24,
    'linen',
    0.39,
  );
  box(
    'Bed headboard south',
    bed.x,
    bed.z + bed.length - 0.075,
    bed.width,
    0.075,
    1.04,
    'linen',
    0.02,
  );
  box('Bed duvet', bed.x + 0.05, bed.z + 0.03, bed.width - 0.1, 1.62, 0.055, 'sage', 0.635);
  box('Bed folded cover', bed.x + 0.05, bed.z + 0.15, bed.width - 0.1, 0.4, 0.035, 'linen', 0.69);
  for (const x of [bed.x + 0.46, bed.x + 1.34])
    ellipsoid('Bedroom pillow', x, bed.z + bed.length - 0.42, 0.34, 0.21, 0.17, 'linen', 0.65);
  for (const [i, x] of bedside.xs.entries()) {
    cabinet(
      model,
      `Bedside table ${i === 0 ? 'west' : 'east'} 450 x 400`,
      x,
      bedside.z,
      bedside.width,
      bedside.depth,
      0.45,
      'oak_light',
      'north',
    );
    const lampX = x + bedside.width / 2;
    const lampZ = bedside.z + bedside.depth / 2;
    cylinder('Bedside light base', lampX, lampZ, 0.07, 0.025, 'dark', 0.45);
    cylinder('Bedside light stem', lampX, lampZ, 0.012, 0.25, 'dark', 0.475);
    cylinder('Bedside light shade', lampX, lampZ, 0.115, 0.14, 'linen', 0.66);
  }
  cabinet(
    model,
    'Bedroom north storage',
    northStorage.x,
    northStorage.z,
    northStorage.width,
    northStorage.depth,
    0.56,
    'white',
    'south',
    0.3,
  );
  box('Bedroom desk', desk.x, desk.z, desk.width, desk.depth, 0.045, 'oak_light', 0.735);
  for (const x of [desk.x + 0.03, desk.x + desk.width - 0.075])
    box('Bedroom desk support', x, desk.z + desk.depth - 0.075, 0.045, 0.045, 0.715, 'dark', 0.02);
  chair(model, 'Bedroom chair', 8.43, 4.15, Math.PI);
  for (const z of [4.12, 4.54, 6.13, 6.439])
    box('Bedroom curtain pleat', PLAN.exterior.east - 0.1, z, 0.05, 0.16, 2.54, 'linen', 0.08);
  // Schematic rack: the plan symbol bounding box is approximate.
  box('Plant rack side', 9.32, 3.44, 0.028, 0.55, 1.75, 'dark');
  for (const base of [0.15, 0.66, 1.18]) {
    box('Plant rack shelf', 9.32, 3.44, 0.48, 0.55, 0.022, 'oak_light', base);
    plant(model, 'Plant rack pot', 9.44, 3.61, 0.08, base + 0.025, 0.33);
  }
}
