import type { ModelBuilder } from '../core/builder.ts';

/** Monitor-centred workstation, facing north before rotation. */
export function pcSetup(model: ModelBuilder, name: string, x: number, z: number, rot = 0) {
  const { box, ellipsoid, cylinder, parts, rotateParts } = model;
  const firstPart = parts.length;
  box(`${name} monitor base`, x - 0.11, z - 0.1, 0.22, 0.2, 0.015, 'dark', 0.782);
  box(`${name} monitor stand`, x - 0.018, z - 0.015, 0.036, 0.035, 0.14, 'dark', 0.797);
  box(`${name} monitor bezel`, x - 0.32, z - 0.025, 0.64, 0.05, 0.38, 'black', 0.88);
  box(`${name} monitor screen`, x - 0.295, z - 0.032, 0.59, 0.01, 0.33, 'dark', 0.905);
  // Desktop detail visible from the seated side.
  box(`${name} screen window`, x - 0.265, z - 0.039, 0.36, 0.006, 0.25, 'sage', 0.94);
  for (let row = 0; row < 3; row++) {
    box(
      `${name} screen line ${row + 1}`,
      x - 0.235,
      z - 0.043,
      0.22 - row * 0.035,
      0.004,
      0.012,
      'linen',
      1.13 - row * 0.045,
    );
  }
  box(`${name} keyboard`, x - 0.225, z - 0.4, 0.45, 0.15, 0.02, 'dark', 0.79);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      box(
        `${name} key ${row + 1}-${col + 1}`,
        x - 0.214 + col * 0.047,
        z - 0.388 + row * 0.038,
        0.037,
        0.027,
        0.006,
        'tile',
        0.81,
      );
    }
  }
  box(`${name} mouse mat`, x + 0.27, z - 0.45, 0.2, 0.25, 0.006, 'linen', 0.79);
  ellipsoid(`${name} mouse`, x + 0.36, z - 0.34, 0.065, 0.115, 0.035, 'dark', 0.796);
  box(`${name} tower`, x + 0.36, z - 0.28, 0.22, 0.4, 0.55, 'dark', 0.04);
  box(`${name} tower front`, x + 0.375, z - 0.29, 0.19, 0.012, 0.51, 'black', 0.06);
  for (const fanBase of [0.13, 0.32]) {
    ellipsoid(`${name} tower fan`, x + 0.47, z - 0.296, 0.115, 0.008, 0.115, 'sage', fanBase);
  }
  cylinder(`${name} tower power light`, x + 0.54, z - 0.2, 0.006, 0.003, 'sage', 0.591);
  rotateParts(firstPart, x, z, rot);
}

/** Open shelves facing west, framing one end of the window seat. */
export function nicheBookcase(
  model: ModelBuilder,
  name: string,
  x: number,
  z: number,
  w: number,
  d: number,
) {
  const { box } = model;
  box(`${name} back`, x + w - 0.018, z, 0.018, d, 2.61, 'oak_light', 0.025);
  for (const sideZ of [z, z + d - 0.025]) {
    box(`${name} side`, x, sideZ, w, 0.025, 2.61, 'oak_light', 0.025);
  }
  const colors = ['linen', 'sage', 'terra'] as const;
  for (const [level, base] of [0.08, 0.48, 0.92, 1.36, 1.8, 2.24, 2.61].entries()) {
    box(`${name} shelf ${level + 1}`, x, z, w, d, 0.025, 'oak_light', base);
    if (level === 6) continue;
    for (let book = 0; book < 4; book++) {
      box(
        `${name} book ${level + 1}-${book + 1}`,
        x + 0.035,
        z + 0.06 + book * 0.062,
        0.23,
        0.045,
        0.2 + 0.025 * ((level + book) % 3),
        colors[(level + book) % colors.length]!,
        base + 0.025,
      );
    }
  }
}
