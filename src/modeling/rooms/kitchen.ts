import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { chair } from '../furniture/seating.ts';

export function buildKitchen(model: ModelBuilder) {
  const { box, cylinder } = model;
  // Round 900 mm table and three independent chairs.
  cylinder('Dining tabletop D900', 4.46, 0.6, 0.45, 0.045, 'oak_light', 0.735);
  cylinder('Dining central leg', 4.46, 0.6, 0.072, 0.715, 'oak', 0.02);
  cylinder('Dining base', 4.46, 0.6, 0.3, 0.025, 'oak', 0.02);
  chair(model, 'Dining chair west', 3.83, 0.6, -Math.PI / 2);
  chair(model, 'Dining chair east', 5.09, 0.6, Math.PI / 2);
  chair(model, 'Dining chair south', 4.46, 1.27, Math.PI);
  // 600 + 600 + 600 + 674 mm, followed by the 720 mm deep return.
  for (const [i, [x, w]] of (
    [
      [3.36, 0.6],
      [3.96, 0.6],
      [4.56, 0.6],
      [5.16, 0.674],
    ] as const
  ).entries()) {
    cabinet(model, `Kitchen base ${i + 1}`, x, 2.46, w, 0.72, 0.86, 'oak_light', 'north');
  }
  box('Kitchen worktop', 3.345, 2.445, 2.505, 0.75, 0.035, 'stone', 0.86);
  // 100 mm of worktop between the sink rim and west return wall.
  const sinkX = 3.462;
  box('Kitchen sink outline', sinkX, 2.505, 0.5, 0.43, 0.018, 'dark', 0.899);
  box('Kitchen sink bowl', sinkX + 0.045, 2.545, 0.41, 0.33, 0.02, 'tile', 0.902);
  cylinder('Kitchen mixer', sinkX + 0.23, 2.97, 0.015, 0.25, 'dark', 0.9);
  box('Kitchen mixer spout', sinkX + 0.216, 2.82, 0.028, 0.16, 0.022, 'dark', 1.13);
  box('Induction hob', 5.2, 2.53, 0.58, 0.48, 0.022, 'black', 0.9);
  for (const [x, z, r] of [
    [5.34, 2.67, 0.085],
    [5.64, 2.67, 0.065],
    [5.36, 2.86, 0.065],
    [5.62, 2.85, 0.085],
  ] as const) {
    cylinder('Hob cooking zone', x, z, r, 0.006, 'dark', 0.924);
  }
  cabinet(model, 'Kitchen corner return', 5.834, 2.46, 0.72, 0.72, 0.86, 'oak_light', 'west');
  box('Kitchen return worktop', 5.819, 1.84, 0.75, 1.35, 0.035, 'stone', 0.86);
  cabinet(model, 'Kitchen return base 600', 5.834, 1.84, 0.72, 0.6, 0.86, 'oak_light', 'west');
  cabinet(model, 'Refrigerator 720 x 700', 5.834, 1.14, 0.72, 0.7, 2.2, 'white', 'west');
  box('Refrigerator handle', 5.797, 1.68, 0.028, 0.018, 0.62, 'dark', 0.93);
  for (let i = 0; i < 4; i++)
    cabinet(
      model,
      `Kitchen wall cabinet ${i + 1}`,
      3.36 + i * 0.615,
      2.875,
      0.6,
      0.305,
      0.85,
      'white',
      'north',
      1.75,
    );
}
