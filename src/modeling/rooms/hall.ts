import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { PLAN } from '../plan.ts';

export function buildHall(model: ModelBuilder) {
  const { box, ellipsoid } = model;
  const p = PLAN.hall;
  cabinet(
    model,
    'Hall wardrobe 2866 x 650',
    p.wardrobe.x,
    p.wardrobe.z,
    p.wardrobe.width,
    p.wardrobe.depth,
    2.55,
    'oak_light',
    'south',
  );
  cabinet(
    model,
    'Hall shallow cupboard',
    PLAN.kitchen.west,
    p.wardrobe.z,
    p.cheekX - PLAN.kitchen.west,
    p.returnNorth - p.wardrobe.z,
    2.55,
    'white',
    'west',
  );
  cabinet(
    model,
    'Utility base cupboard 882',
    p.utility.x,
    p.utility.z,
    p.utility.width,
    p.utility.depth,
    0.89,
    'oak_light',
    'north',
  );
  const laundryX = p.utility.x + p.utility.width;
  box(
    'Laundry utility back panel',
    laundryX,
    p.utility.z + p.utility.depth - 0.018,
    p.utility.laundryWidth,
    0.018,
    2.5,
    'white',
  );
  box('Laundry utility west panel', laundryX, p.utility.z, 0.018, p.utility.depth, 2.5, 'white');
  box(
    'Laundry utility east panel',
    laundryX + p.utility.laundryWidth - 0.018,
    p.utility.z,
    0.018,
    p.utility.depth,
    2.5,
    'white',
  );
  box(
    'Laundry utility top panel',
    laundryX,
    p.utility.z,
    p.utility.laundryWidth,
    p.utility.depth,
    0.018,
    'white',
    2.482,
  );
  for (const [base, name] of [
    [0.08, 'Washing machine'],
    [0.96, 'Tumble dryer'],
  ] as const) {
    const centreX = laundryX + p.utility.laundryWidth / 2;
    // The note «на 45» is represented as a schematic 450 mm total depth.
    box(name, centreX - 0.29, p.utility.z + 0.025, 0.58, 0.425, 0.8, 'white', base);
    ellipsoid(`${name} door`, centreX, p.utility.z + 0.014, 0.36, 0.028, 0.36, 'dark', base + 0.21);
    ellipsoid(
      `${name} glass`,
      centreX,
      p.utility.z + 0.009,
      0.275,
      0.018,
      0.275,
      'mirror',
      base + 0.2525,
    );
  }
  box(
    'Utility worktop',
    p.utility.x,
    p.utility.z,
    p.utility.width,
    p.utility.depth,
    0.035,
    'stone',
    0.89,
  );
  cabinet(
    model,
    'Utility lower storage',
    p.utility.x,
    6.278,
    1.532,
    0.267,
    0.89,
    'oak_light',
    'north',
  );
  cabinet(
    model,
    'Hall console',
    p.console.x,
    p.console.z,
    p.console.width,
    p.console.length,
    0.84,
    'oak_light',
    'west',
  );
  box(
    'Entrance bench base',
    p.bench.x,
    p.bench.z,
    p.bench.width,
    p.bench.length,
    0.37,
    'oak',
    0.02,
  );
  box(
    'Entrance bench cushion',
    p.bench.x,
    p.bench.z,
    p.bench.width,
    p.bench.length,
    0.08,
    'linen',
    0.39,
  );
}
