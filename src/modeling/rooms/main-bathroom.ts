import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { basin, bathtub, toilet } from '../furniture/bathroom.ts';

export function buildMainBathroom(model: ModelBuilder) {
  const { box } = model;
  // Bath ends at z=3.85, where the east-wall doorway begins.
  bathtub(model, 'Bathroom 1 bathtub 1700 x 700', 0.0675, 3.15);
  cabinet(
    model,
    'Bathroom 1 west double vanity',
    0.015,
    4.025,
    0.5,
    1.57,
    0.52,
    'oak_light',
    'east',
    0.29,
  );
  box('Bathroom 1 stone top', 0.005, 4.015, 0.52, 1.59, 0.035, 'stone', 0.81);
  for (const [suffix, z] of [
    ['north', 4.42],
    ['south', 5.2],
  ] as const) {
    basin(model, `Bathroom 1 basin ${suffix}`, 0.265, z, 0.55, 0.4, 0.85, -Math.PI / 2);
    box('Cat litter tray under vanity', 0.05, z - 0.25, 0.43, 0.5, 0.16, 'white', 0.02);
  }
  box('Bathroom 1 west mirror', 0.012, 4.095, 0.024, 1.44, 0.91, 'mirror', 1.1);
  toilet(model, 'Bathroom 1 WC', 1.385, 5.22);
  box('Bathroom 1 installation shelf', 0.985, 5.47, 0.82, 0.14, 0.045, 'oak', 1.12);
}
