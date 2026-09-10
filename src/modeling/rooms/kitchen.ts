import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { chair } from '../furniture/seating.ts';
import { PLAN } from '../plan.ts';

export function buildKitchen(model: ModelBuilder) {
  const { box, cylinder } = model;
  const k = PLAN.kitchen;
  cylinder(
    'Dining tabletop D900',
    k.dining.x,
    k.dining.z,
    k.dining.diameter / 2,
    0.045,
    'oak_light',
    0.735,
  );
  cylinder('Dining central leg', k.dining.x, k.dining.z, 0.072, 0.715, 'oak', 0.02);
  cylinder('Dining base', k.dining.x, k.dining.z, 0.3, 0.025, 'oak', 0.02);
  // Centres from the plan's chair symbols; detailed chair dimensions are schematic.
  chair(model, 'Dining chair west', 3.935, 0.506, Math.PI / 2);
  chair(model, 'Dining chair east', 5.012, 0.479, -Math.PI / 2);
  chair(model, 'Dining chair south', 4.443, 1.038, Math.PI);

  const frontZ = k.back - k.depth;
  const returnX = k.east - k.returnWidth;
  let x = k.west;
  for (const [i, width] of k.modules.entries()) {
    cabinet(
      model,
      `Kitchen base ${i + 1}${i === 0 ? ' dishwasher' : ''}`,
      x,
      frontZ,
      width,
      k.depth,
      0.86,
      'oak_light',
      'north',
    );
    x += width;
  }
  box(
    'Kitchen worktop 2474 x 750',
    k.west,
    frontZ,
    returnX - k.west,
    k.depth,
    0.035,
    'stone',
    0.86,
  );
  const sinkX = k.west + k.modules[0];
  // The sink is over the second 600 mm module; the first is the dishwasher.
  box('Kitchen sink outline', sinkX, 2.456, 0.6, 0.5, 0.018, 'dark', 0.899);
  box('Kitchen sink bowl', sinkX + 0.04, 2.496, 0.52, 0.42, 0.02, 'tile', 0.902);
  cylinder('Kitchen mixer', sinkX + 0.3, 3.035, 0.015, 0.25, 'dark', 0.9);
  box('Kitchen mixer spout', sinkX + 0.286, 2.88, 0.028, 0.16, 0.022, 'dark', 1.13);
  box('Induction hob', 5.239, 2.487, 0.58, 0.49, 0.022, 'black', 0.9);
  for (const [cx, cz, r] of [
    [5.38, 2.625, 0.085],
    [5.67, 2.625, 0.065],
    [5.38, 2.835, 0.065],
    [5.67, 2.835, 0.085],
  ] as const)
    cylinder('Hob cooking zone', cx, cz, r, 0.006, 'dark', 0.924);

  const cornerZ = k.back - k.returnDepth;
  const middleZ = cornerZ - k.middleDepth;
  const fridgeZ = middleZ - k.fridgeDepth;
  cabinet(
    model,
    'Kitchen corner return',
    returnX,
    cornerZ,
    k.returnWidth,
    k.returnDepth,
    0.86,
    'oak_light',
    'west',
  );
  cabinet(
    model,
    'Kitchen return base 600',
    returnX,
    middleZ,
    k.returnWidth,
    k.middleDepth,
    0.86,
    'oak_light',
    'west',
  );
  box(
    'Kitchen return worktop',
    returnX,
    middleZ,
    k.returnWidth,
    k.middleDepth + k.returnDepth,
    0.035,
    'stone',
    0.86,
  );
  cabinet(
    model,
    'Refrigerator 720 x 700',
    returnX,
    fridgeZ,
    k.returnWidth,
    k.fridgeDepth,
    2.2,
    'white',
    'west',
  );
  for (let i = 0; i < 3; i++)
    cabinet(
      model,
      `Kitchen wall cabinet ${i + 1}`,
      4.023 + i * 0.6,
      2.765,
      0.6,
      0.398,
      0.85,
      'white',
      'north',
      1.75,
    );
}
