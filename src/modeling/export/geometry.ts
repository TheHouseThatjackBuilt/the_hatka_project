import type { ModelShape, Vector3Tuple } from '../../model/types.ts';
import { TAU } from '../core/builder.ts';

export interface PrimitiveGeometry {
  positions: number[];
  normals: number[];
  indices: number[];
}

/** Unit primitives matching the source export, including vertex order and winding. */
export function primitiveGeometry(shape: ModelShape): PrimitiveGeometry {
  const positions: number[] = [],
    normals: number[] = [],
    indices: number[] = [];
  if (shape === 'box') {
    const faces: [Vector3Tuple[], Vector3Tuple][] = [
      [
        [
          [1, -1, -1],
          [1, 1, -1],
          [1, 1, 1],
          [1, -1, 1],
        ],
        [1, 0, 0],
      ],
      [
        [
          [-1, -1, 1],
          [-1, 1, 1],
          [-1, 1, -1],
          [-1, -1, -1],
        ],
        [-1, 0, 0],
      ],
      [
        [
          [-1, 1, -1],
          [-1, 1, 1],
          [1, 1, 1],
          [1, 1, -1],
        ],
        [0, 1, 0],
      ],
      [
        [
          [-1, -1, 1],
          [-1, -1, -1],
          [1, -1, -1],
          [1, -1, 1],
        ],
        [0, -1, 0],
      ],
      [
        [
          [1, -1, 1],
          [1, 1, 1],
          [-1, 1, 1],
          [-1, -1, 1],
        ],
        [0, 0, 1],
      ],
      [
        [
          [-1, -1, -1],
          [-1, 1, -1],
          [1, 1, -1],
          [1, -1, -1],
        ],
        [0, 0, -1],
      ],
    ];
    for (const [points, normal] of faces) {
      const start = positions.length / 3;
      for (const point of points) {
        positions.push(...point.map((value) => value * 0.5));
        normals.push(...normal);
      }
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
  } else if (shape === 'sphere') {
    const nx = 20,
      ny = 12;
    for (let j = 0; j <= ny; j++) {
      const b = (j * Math.PI) / ny;
      for (let i = 0; i <= nx; i++) {
        const a = (i * TAU) / nx;
        const point = [Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)];
        positions.push(...point.map((value) => value * 0.5));
        normals.push(...point);
      }
    }
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i,
          b = a + nx + 1;
        indices.push(a, b + 1, b, a, a + 1, b + 1);
      }
    }
  } else {
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const a = (i * TAU) / steps,
        x = Math.cos(a),
        z = Math.sin(a);
      for (const y of [-0.5, 0.5]) {
        positions.push(x * 0.5, y, z * 0.5);
        normals.push(x, 0, z);
      }
    }
    for (let i = 0; i < steps; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
    for (const [y, sign] of [
      [-0.5, -1],
      [0.5, 1],
    ] as const) {
      const centre = positions.length / 3;
      positions.push(0, y, 0);
      normals.push(0, sign, 0);
      for (let i = 0; i < steps; i++) {
        const a = (i * TAU) / steps;
        positions.push(0.5 * Math.cos(a), y, 0.5 * Math.sin(a));
        normals.push(0, sign, 0);
      }
      for (let i = 0; i < steps; i++) {
        const a = centre + 1 + i,
          b = centre + 1 + ((i + 1) % steps);
        indices.push(...(sign === 1 ? [centre, b, a] : [centre, a, b]));
      }
    }
  }
  return { positions, normals, indices };
}
