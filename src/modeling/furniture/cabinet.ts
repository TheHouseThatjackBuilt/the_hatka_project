import type { ModelBuilder } from '../core/builder.ts';
import type { MaterialId } from '../core/materials.ts';
import { roundTo } from '../core/round.ts';

export function cabinet(
  model: ModelBuilder,
  name: string,
  x: number,
  z: number,
  w: number,
  d: number,
  h = 2.55,
  mat: MaterialId = 'oak_light',
  front: 'south' | 'north' | 'east' | 'west' = 'south',
  base = 0,
) {
  const { box } = model;
  const horizontal = front === 'south' || front === 'north';
  // w/d describe the complete plan footprint, including fronts and pulls.
  // Previously every front silently added 18-58 mm to the requested size.
  const frontDepth = horizontal ? 0.044 : 0.018;
  box(
    name,
    x + (front === 'west' ? frontDepth : 0),
    z + (front === 'north' ? frontDepth : 0),
    w - (horizontal ? 0 : frontDepth),
    d - (horizontal ? frontDepth : 0),
    h,
    mat,
    base,
  );
  const count = Math.max(1, roundTo((horizontal ? w : d) / 0.55));
  for (let i = 0; i < count; i++) {
    if (horizontal) {
      const fx = x + (i * w) / count + 0.015,
        fz = front === 'south' ? z + d - frontDepth : z + 0.026;
      box(
        `${name} / door ${i + 1}`,
        fx,
        fz,
        w / count - 0.03,
        0.018,
        h - 0.05,
        'white',
        base + 0.025,
      );
      box(
        `${name} / pull ${i + 1}`,
        fx + w / count - 0.09,
        front === 'north' ? z : z + d - 0.026,
        0.015,
        0.026,
        0.18,
        'dark',
        base + h * 0.48,
      );
    } else {
      const fx = front === 'east' ? x + w - frontDepth : x,
        fz = z + (i * d) / count + 0.015;
      box(
        `${name} / door ${i + 1}`,
        fx,
        fz,
        0.018,
        d / count - 0.03,
        h - 0.05,
        'white',
        base + 0.025,
      );
    }
  }
}
