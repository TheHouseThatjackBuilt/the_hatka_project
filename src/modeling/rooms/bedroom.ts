import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { plant } from '../furniture/plant.ts';

export function buildBedroom(model: ModelBuilder) {
  const { box, ellipsoid, cylinder } = model;
  box('Bedroom rug', 7.25, 4.47, 2.29, 2.25, 0.018, 'rug', 0.021);
  box('Bed frame', 7.36, 4.64, 1.86, 2.16, 0.28, 'oak', 0.11);
  box('Mattress 1800 x 2100', 7.39, 4.67, 1.8, 2.1, 0.24, 'linen', 0.39);
  box('Bed headboard south', 7.34, 6.71, 1.9, 0.075, 1.04, 'linen', 0.02);
  box('Bed duvet', 7.415, 4.7, 1.75, 1.62, 0.055, 'sage', 0.635);
  box('Bed folded cover', 7.415, 4.83, 1.75, 0.4, 0.035, 'linen', 0.69);
  for (const x of [7.87, 8.68])
    ellipsoid('Bedroom pillow', x, 6.38, 0.68, 0.42, 0.17, 'linen', 0.65);
  for (const x of [6.79, 9.3]) {
    cabinet(model, 'Bedside table 450 x 400', x, 6.36, 0.45, 0.4, 0.45, 'oak_light', 'north');
    cylinder('Bedside light base', x + 0.22, 6.55, 0.07, 0.025, 'dark', 0.45);
    cylinder('Bedside light stem', x + 0.22, 6.55, 0.012, 0.25, 'dark', 0.475);
    cylinder('Bedside light shade', x + 0.22, 6.55, 0.115, 0.14, 'linen', 0.66);
  }
  cabinet(
    model,
    'Bedroom north cabinet 1960',
    7.704,
    3.45,
    1.96,
    0.396,
    0.56,
    'white',
    'south',
    0.3,
  );
  box('Bedroom north shelf', 6.72, 3.45, 3.24, 0.4, 0.035, 'oak_light', 0.86);
  for (const z of [4.12, 4.54, 6.13, 6.55])
    box('Bedroom curtain pleat', 9.88, z, 0.05, 0.16, 2.54, 'linen', 0.08);
  box('Plant rack side', 9.742, 3.48, 0.028, 0.32, 1.75, 'dark');
  for (const base of [0.15, 0.66, 1.18]) {
    box('Plant rack shelf', 9.742, 3.48, 0.24, 0.36, 0.022, 'oak_light', base);
    plant(model, 'Plant rack pot', 9.86, 3.65, 0.08, base + 0.025, 0.33);
  }
}
