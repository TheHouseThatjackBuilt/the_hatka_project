import type { ModelBuilder } from '../core/builder.ts';
import { bathtub, toilet } from '../furniture/bathroom.ts';
import { PLAN } from '../plan.ts';

export function buildEnsuite(model: ModelBuilder) {
  const p = PLAN.ensuite;
  toilet(model, 'Ensuite WC', 5.399, 6.065, { width: 0.35, depth: 0.56, cistern: false });
  bathtub(
    model,
    'Ensuite bathtub 820 x 1499',
    p.west + p.toiletWidth,
    p.north,
    p.bathWidth,
    p.bathLength,
  );
  model.box(
    'Ensuite installation shelf',
    p.west,
    6.345,
    p.toiletWidth,
    p.installationDepth,
    1.1,
    'white',
  );
}
