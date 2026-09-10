import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { PLAN } from '../plan.ts';

export function buildCloakroom(model: ModelBuilder) {
  const p = PLAN.cloakroom;
  cabinet(
    model,
    'Cloakroom north storage',
    0,
    p.northStorageZ,
    p.width,
    p.northStorageDepth,
    2.55,
    'oak_light',
    'south',
  );
  model.box('Cloakroom clothes back panel', 0, p.clothesZ, p.width, 0.018, 2.55, 'oak_light');
  model.box(
    'Cloakroom clothes west panel',
    0,
    p.clothesZ,
    0.018,
    p.clothesDepth,
    2.55,
    'oak_light',
  );
  model.box(
    'Cloakroom clothes east panel',
    p.width - 0.018,
    p.clothesZ,
    0.018,
    p.clothesDepth,
    2.55,
    'oak_light',
  );
  model.box(
    'Cloakroom clothes top panel',
    0,
    p.clothesZ,
    p.width,
    p.clothesDepth,
    0.018,
    'oak_light',
    2.532,
  );
  cabinet(
    model,
    'Cloakroom west storage',
    0,
    p.clothesZ + p.clothesDepth,
    p.westStorageDepth,
    p.westStorageLength,
    2.55,
    'oak_light',
    'east',
  );
  cabinet(
    model,
    'Cloakroom south storage',
    0,
    p.southStorageZ,
    p.width,
    0.209,
    2.46,
    'oak_light',
    'north',
    0.19,
  );
  model.box(
    'Cloakroom open rail',
    0.06,
    p.clothesZ + 0.15,
    p.width - 0.12,
    0.027,
    0.027,
    'dark',
    1.74,
  );
  for (let i = 0; i < 8; i++)
    model.box(
      'Cloakroom hanging garment',
      0.14 + i * 0.2,
      p.clothesZ + 0.2,
      0.08,
      0.39,
      0.86,
      i % 2 ? 'linen' : 'sage',
      0.87,
    );
  model.box('Robot vacuum dock', 1.34, p.southStorageZ + 0.014, 0.32, 0.18, 0.085, 'dark', 0.02);
}
