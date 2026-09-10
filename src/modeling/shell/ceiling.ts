import { CEILING_HEIGHT, type ModelBuilder } from '../core/builder.ts';
import { PLAN } from '../plan.ts';

export function buildCeiling(model: ModelBuilder) {
  const e = PLAN.exterior;
  model.box('Ceiling main', 0, 0, e.east, e.utilitySouth, 0.08, 'white', CEILING_HEIGHT, 'ceiling');
  model.box(
    'Ceiling bedroom south',
    PLAN.bedroom.west,
    e.utilitySouth,
    e.east - PLAN.bedroom.west,
    e.bedroomSouth - e.utilitySouth,
    0.08,
    'white',
    CEILING_HEIGHT,
    'ceiling',
  );
  model.box(
    'Ceiling entrance',
    0,
    e.utilitySouth,
    e.entranceEast,
    e.entranceSouth - e.utilitySouth,
    0.08,
    'white',
    CEILING_HEIGHT,
    'ceiling',
  );
}
