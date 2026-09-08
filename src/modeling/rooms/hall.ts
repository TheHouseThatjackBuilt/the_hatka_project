import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { basin } from '../furniture/bathroom.ts';

export function buildHall(model: ModelBuilder) {
  const { box, ellipsoid } = model;
  cabinet(model, 'Hall wardrobe 2866 x 650', 3.7, 3.43, 2.866, 0.65, 2.55, 'oak_light', 'south');
  cabinet(model, 'Hall shallow cupboard', 3.36, 3.45, 0.22, 1.25, 2.55, 'white', 'west');
  cabinet(model, 'Utility base cupboard 882', 3.36, 5.53, 0.882, 0.55, 0.89, 'oak_light', 'north');
  cabinet(model, 'Laundry utility housing 650', 4.242, 5.53, 0.642, 0.65, 2.5, 'white', 'north');
  for (const [base, name] of [
    [0.08, 'Washing machine'],
    [0.96, 'Tumble dryer'],
  ] as const) {
    box(name, 4.267, 5.52, 0.58, 0.5, 0.8, 'white', base);
    // Face circles are ellipsoids facing -Z.
    ellipsoid(`${name} door`, 4.557, 5.508, 0.36, 0.028, 0.36, 'dark', base + 0.21);
    ellipsoid(`${name} glass`, 4.557, 5.485, 0.275, 0.018, 0.275, 'mirror', base + 0.2525);
  }
  box('Utility worktop', 3.35, 5.51, 0.9, 0.59, 0.035, 'stone', 0.89);
  basin(model, 'Utility basin', 4.54, 6.43, 0.34, 0.25, 0.83);
  cabinet(model, 'Hall console', 2.805, 5.77, 0.35, 0.79, 0.84, 'oak_light', 'west');
  box('Entrance bench base', 2.805, 6.7, 0.35, 0.7, 0.37, 'oak', 0.02);
  box('Entrance bench cushion', 2.785, 6.7, 0.38, 0.7, 0.08, 'linen', 0.39);
  box('Entrance full-length mirror', 3.128, 7.04, 0.02, 0.6, 1.8, 'mirror', 0.35);
}
