import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';

export function buildLivingRoom(model: ModelBuilder) {
  const { box, ellipsoid } = model;
  // Calibrated by the 3122 mm pier distance and 1150 mm sofa depth.
  box('Sofa plinth', 0.09, 0.075, 2.97, 1.1, 0.19, 'oak', 0.04);
  box('Sofa base', 0.06, 0.025, 3.0, 1.15, 0.29, 'linen', 0.19);
  for (const x of [0.06, 2.9]) box('Sofa arm', x, 0.04, 0.16, 1.1, 0.56, 'linen', 0.2);
  for (let i = 0; i < 2; i++) {
    const x = 0.235 + i * 1.325;
    box(`Sofa seat ${i + 1}`, x, 0.28, 1.29, 0.81, 0.16, 'linen', 0.47);
    box(`Sofa back cushion ${i + 1}`, x, 0.075, 1.29, 0.22, 0.46, 'linen', 0.53);
  }
  ellipsoid('Sofa sage pillow', 0.77, 0.51, 0.6, 0.44, 0.16, 'sage', 0.64, 0.36);
  ellipsoid('Sofa clay pillow', 0.46, 0.58, 0.43, 0.4, 0.14, 'terra', 0.65, -0.18);
  cabinet(model, 'TV console 1935 x 400', 0, 2.63, 1.935, 0.4, 0.38, 'oak_light');
  box('Projector screen housing', 0.03, 3.006, 1.87, 0.045, 0.075, 'white', 2.5);
  box('Projector screen', 0.045, 2.998, 1.84, 0.018, 1.08, 'white', 1.39);
}
