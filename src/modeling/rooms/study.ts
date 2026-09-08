import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { officeChair } from '../furniture/seating.ts';
import { nicheBookcase, pcSetup } from '../furniture/study.ts';

export function buildStudy(model: ModelBuilder) {
  const { box, ellipsoid } = model;
  // Continuous 700 mm deep L-desk; the west leg starts beyond the door.
  box('Study L desk west worktop', 6.724, 1.08, 0.7, 1.38, 0.045, 'oak_light', 0.735);
  box('Study L desk south worktop', 6.724, 2.46, 2.38, 0.7, 0.045, 'oak_light', 0.735);
  cabinet(model, 'Study desk drawer unit', 6.75, 1.1, 0.64, 0.35, 0.68, 'oak_light', 'east', 0.03);
  for (const [legX, legZ] of [
    [6.75, 2.99],
    [7.34, 3.08],
    [9.025, 2.49],
    [9.025, 3.08],
  ] as const) {
    box('Study desk steel leg', legX, legZ, 0.045, 0.045, 0.715, 'dark', 0.02);
  }
  box('Study desk west cable tray', 6.78, 1.46, 0.12, 1.5, 0.06, 'dark', 0.63);
  box('Study desk south cable tray', 7.42, 3.02, 1.58, 0.12, 0.06, 'dark', 0.63);
  pcSetup(model, 'Study PC 1', 6.94, 1.75, -Math.PI / 2);
  pcSetup(model, 'Study PC 2', 8.45, 2.98);
  officeChair(model, 'Study office chair 1', 7.8, 1.58, -Math.PI / 2);

  // Window-height daybed with 2000 × 740 mm cushion and storage below.
  box('Study window seat plinth', 9.18, 0.56, 0.72, 2.04, 0.08, 'oak', 0.02);
  cabinet(
    model,
    'Study window seat storage',
    9.142,
    0.535,
    0.81,
    2.09,
    0.63,
    'oak_light',
    'west',
    0.1,
  );
  box('Study window seat platform', 9.102, 0.51, 0.86, 2.14, 0.035, 'oak_light', 0.73);
  box('Study window seat cushion', 9.152, 0.57, 0.74, 2.0, 0.07, 'linen', 0.765);
  ellipsoid('Study window seat pillow north', 9.5, 0.84, 0.6, 0.42, 0.16, 'sage', 0.835, 0.1);
  ellipsoid('Study window seat pillow clay', 9.54, 1.1, 0.5, 0.3, 0.12, 'terra', 0.835, -0.12);
  box('Study window seat folded throw', 9.17, 2.15, 0.7, 0.32, 0.025, 'sage', 0.838);
  nicheBookcase(model, 'Study niche north bookcase', 9.122, 0.025, 0.84, 0.455);
  nicheBookcase(model, 'Study niche south bookcase', 9.122, 2.7, 0.84, 0.46);

  // The shallower overhead bridge clears the window head at 2350 mm.
  box('Study niche bridge bottom', 9.542, 0.48, 0.42, 2.22, 0.035, 'oak_light', 2.38);
  box('Study niche bridge top', 9.542, 0.48, 0.42, 2.22, 0.035, 'oak_light', 2.6);
  box('Study niche bridge back', 9.944, 0.48, 0.018, 2.22, 0.22, 'oak_light', 2.415);
  for (const dividerZ of [0.48, 1.2, 1.92, 2.675])
    box('Study niche bridge divider', 9.542, dividerZ, 0.42, 0.025, 0.185, 'oak_light', 2.415);
  const colors = ['sage', 'linen', 'terra'] as const;
  for (const cubbyZ of [0.58, 1.3, 2.02]) {
    for (let book = 0; book < 5; book++) {
      box(
        'Study niche bridge book',
        9.57,
        cubbyZ + book * 0.065,
        0.22,
        0.048,
        0.15 + 0.01 * (book % 3),
        colors[book % colors.length]!,
        2.415,
      );
    }
  }
  box('Study plant wall backing', 6.714, 1.14, 0.035, 0.3, 1.2, 'oak', 1.03);
  for (let k = 0; k < 5; k++)
    ellipsoid('Study plant wall foliage', 6.77, 1.28, 0.1, 0.28, 0.25, 'green', 1.07 + k * 0.22);
}
