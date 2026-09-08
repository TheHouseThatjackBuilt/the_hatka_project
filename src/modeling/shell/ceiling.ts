import { CEILING_HEIGHT, type ModelBuilder } from '../core/builder.ts';

export function buildCeiling(model: ModelBuilder) {
  model.box('Ceiling main', 0, 0, 9.982, 6.82, 0.08, 'white', CEILING_HEIGHT, 'ceiling');
  model.box('Ceiling entrance', 0, 6.82, 3.155, 1.2, 0.08, 'white', CEILING_HEIGHT, 'ceiling');
}
