import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { officeChair } from '../furniture/seating.ts';
import { PLAN } from '../plan.ts';

export function buildStudy(model: ModelBuilder) {
  const { box, ellipsoid } = model;
  const {
    west,
    width,
    deskDepth,
    deskLength,
    windowCabinetDepth,
    upperCabinetDepth,
    plantWallWidth,
    plantWallLength,
  } = PLAN.study;
  const southDeskZ = PLAN.study.south - deskDepth;
  const westDeskZ = southDeskZ - deskLength;
  box('Study south desktop', west, southDeskZ, width, deskDepth, 0.045, 'oak_light', 0.735);
  box('Study west desktop', west, westDeskZ, deskDepth, deskLength, 0.045, 'oak_light', 0.735);
  for (const [x, z] of [
    [west + 0.03, 2.82],
    [west + 0.62, 2.82],
    [west + width - 0.075, 2.82],
  ] as const)
    box('Study desk steel leg', x, z, 0.045, 0.045, 0.715, 'dark', 0.02);
  box('Study desk west leg', west + 0.05, westDeskZ, 0.045, deskLength - 0.08, 0.715, 'dark', 0.02);
  officeChair(model, 'Study chair west desk', 7.72, 1.82, -Math.PI / 2);
  officeChair(model, 'Study chair south desk', 8.31, 2.15, 0);
  cabinet(
    model,
    'Study window cabinet',
    west + width - windowCabinetDepth,
    0,
    windowCabinetDepth,
    southDeskZ,
    0.85,
    'oak_light',
    'west',
    0,
  );
  cabinet(
    model,
    'Study south overhead cabinets',
    west,
    PLAN.study.south - upperCabinetDepth,
    width,
    upperCabinetDepth,
    0.85,
    'oak_light',
    'north',
    1.75,
  );
  box('Study plant wall backing', west, 1.152, 0.018, plantWallLength, 1.2, 'oak', 1.03);
  for (let k = 0; k < 5; k++)
    ellipsoid(
      'Study plant wall foliage',
      west + 0.018 + (plantWallWidth - 0.018) / 2,
      1.152 + 0.13 + (k * (plantWallLength - 0.26)) / 4,
      plantWallWidth - 0.018,
      0.26,
      0.25,
      'green',
      1.07 + k * 0.22,
    );
}
