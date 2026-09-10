import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { PLAN } from '../plan.ts';

export function buildLivingRoom(model: ModelBuilder) {
  const { box, ellipsoid, cylinder } = model;
  const l = PLAN.living;
  const x0 = l.sofaX;
  // The 3122 line starts at the sofa, 13 mm from the wall; it is not a room width.
  box('Sofa plinth', x0 + 0.03, 0.03, l.sofaWidth - 0.06, l.sofaDepth - 0.06, 0.19, 'oak', 0.04);
  box('Sofa base', x0, 0, l.sofaWidth, l.sofaDepth, 0.29, 'linen', 0.19);
  for (const x of [x0, x0 + l.sofaWidth - 0.16])
    box('Sofa arm', x, 0.02, 0.16, 1.1, 0.56, 'linen', 0.2);
  const seatWidth = (l.sofaWidth - 0.35) / 2;
  for (let i = 0; i < 2; i++) {
    const x = x0 + 0.17 + i * (seatWidth + 0.01);
    box(`Sofa seat ${i + 1}`, x, 0.28, seatWidth, 0.81, 0.16, 'linen', 0.47);
    box(`Sofa back cushion ${i + 1}`, x, 0.075, seatWidth, 0.22, 0.46, 'linen', 0.53);
  }
  ellipsoid('Sofa sage pillow', 0.77, 0.51, 0.6, 0.44, 0.16, 'sage', 0.64, 0.36);
  ellipsoid('Sofa clay pillow', 0.46, 0.58, 0.43, 0.4, 0.14, 'terra', 0.65, -0.18);
  const consoleZ = l.sofaDepth + l.sofaToConsole;
  cabinet(
    model,
    'TV console 1935 x 400',
    0,
    consoleZ,
    l.consoleWidth,
    l.consoleDepth,
    0.22,
    'oak_light',
    'north',
    0.16,
  );
  for (const x of [0.25, 0.55]) {
    cylinder('Pet bowl under TV console', x, consoleZ + 0.2, 0.07, 0.045, 'white', 0.02);
    cylinder('Pet bowl recess', x, consoleZ + 0.2, 0.054, 0.005, 'dark', 0.065);
  }
  box(
    'Projector screen housing',
    0,
    consoleZ + l.consoleDepth - 0.025,
    l.consoleWidth,
    0.025,
    0.075,
    'white',
    2.5,
  );
  box(
    'Projector screen',
    0.02,
    consoleZ + l.consoleDepth - 0.028,
    l.consoleWidth - 0.04,
    0.018,
    1.08,
    'white',
    1.39,
  );
  cylinder(
    'Living side table D500',
    l.sideTable.x,
    l.sideTable.z,
    l.sideTable.diameter / 2,
    0.035,
    'oak_light',
    0.45,
  );
  cylinder('Living side table stem', l.sideTable.x, l.sideTable.z, 0.045, 0.43, 'dark', 0.02);
  cylinder('Living side table base', l.sideTable.x, l.sideTable.z, 0.17, 0.025, 'dark', 0.02);
}
