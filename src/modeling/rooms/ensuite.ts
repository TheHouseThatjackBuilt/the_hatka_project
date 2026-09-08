import type { ModelBuilder } from '../core/builder.ts';
import { toilet, walkInShower } from '../furniture/bathroom.ts';

export function buildEnsuite(model: ModelBuilder) {
  toilet(model, 'Ensuite WC', 5.39, 6.33);
  walkInShower(model, 'Ensuite shower 900 x 1740', 5.684, 5.08, 0.9, 1.74);
  model.box('Ensuite installation shelf', 5.015, 6.65, 0.64, 0.15, 0.045, 'oak', 1.12);
}
