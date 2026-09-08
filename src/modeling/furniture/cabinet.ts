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
  box(name, x, z, w, d, h, mat, base);
  const horizontal = front === 'south' || front === 'north';
  const count = Math.max(1, roundTo((horizontal ? w : d) / 0.55));
  for (let i = 0; i < count; i++) {
    if (horizontal) {
      const fx = x + (i * w) / count + 0.015,
        fz = front === 'south' ? z + d : z - 0.018;
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
        front === 'north' ? fz - 0.014 : fz + 0.018,
        0.015,
        0.026,
        0.18,
        'dark',
        base + h * 0.48,
      );
    } else {
      const fx = front === 'east' ? x + w : x - 0.018,
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
