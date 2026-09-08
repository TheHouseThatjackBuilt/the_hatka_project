import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';

export function buildCloakroom(model: ModelBuilder) {
  cabinet(model, 'Cloakroom north storage', 0.02, 5.78, 1.79, 0.4, 2.55, 'oak_light', 'south');
  cabinet(model, 'Cloakroom west storage', 0.02, 6.18, 0.4, 1.28, 2.55, 'oak_light', 'east');
  cabinet(
    model,
    'Cloakroom south storage',
    0.02,
    7.66,
    1.79,
    0.34,
    2.46,
    'oak_light',
    'north',
    0.19,
  );
  model.box('Cloakroom open rail', 0.06, 6.29, 1.66, 0.027, 0.027, 'dark', 1.74);
  for (let i = 0; i < 8; i++)
    model.box(
      'Cloakroom hanging garment',
      0.14 + i * 0.17,
      6.25,
      0.08,
      0.39,
      0.86,
      i % 2 ? 'linen' : 'sage',
      0.87,
    );
  model.cylinder('Robot vacuum', 1.5, 7.74, 0.16, 0.085, 'dark', 0.02);
}
