import { TAU, type ModelBuilder } from '../core/builder.ts';

export function chair(model: ModelBuilder, name: string, x: number, z: number, angle = 0) {
  const { ellipsoid, add, cylinder } = model;
  ellipsoid(`${name} seat`, x, z, 0.45, 0.44, 0.11, 'sage', 0.41, angle);
  const bx = x - Math.sin(angle) * 0.19,
    bz = z - Math.cos(angle) * 0.19;
  add(`${name} back`, 'box', [bx, 0.66, bz], [0.44, 0.4, 0.065], 'sage', 'furniture', angle);
  for (const dx of [-0.15, 0.15]) {
    for (const dz of [-0.15, 0.15]) {
      const lx = x + dx * Math.cos(angle) + dz * Math.sin(angle);
      const lz = z - dx * Math.sin(angle) + dz * Math.cos(angle);
      cylinder(`${name} leg`, lx, lz, 0.017, 0.42, 'oak');
    }
  }
}

/** Padded swivel chair facing south before rotation. */
export function officeChair(model: ModelBuilder, name: string, x: number, z: number, rot = 0) {
  const { box, cylinder, ellipsoid, add, rotateParts, parts } = model;
  const firstPart = parts.length;
  ellipsoid(`${name} seat`, x, z, 0.5, 0.49, 0.1, 'sage', 0.43);
  box(`${name} back frame`, x - 0.225, z - 0.235, 0.45, 0.055, 0.52, 'dark', 0.52);
  box(`${name} back cushion`, x - 0.21, z - 0.185, 0.42, 0.055, 0.46, 'sage', 0.56);
  for (const armX of [x - 0.28, x + 0.245]) {
    box(`${name} arm support`, armX, z - 0.05, 0.025, 0.04, 0.19, 'dark', 0.46);
    box(`${name} armrest`, armX - 0.007, z - 0.18, 0.045, 0.36, 0.04, 'dark', 0.65);
  }
  cylinder(`${name} pedestal`, x, z, 0.035, 0.34, 'dark', 0.1);
  for (let i = 0; i < 5; i++) {
    const angle = (i * TAU) / 5;
    const dx = Math.cos(angle),
      dz = Math.sin(angle);
    add(
      `${name} base spoke`,
      'box',
      [x + dx * 0.13, 0.115, z + dz * 0.13],
      [0.29, 0.025, 0.028],
      'dark',
      'furniture',
      -angle,
    );
    ellipsoid(
      `${name} caster`,
      x + dx * 0.26,
      z + dz * 0.26,
      0.075,
      0.06,
      0.065,
      'black',
      0.03,
      -angle,
    );
  }
  rotateParts(firstPart, x, z, rot);
}
