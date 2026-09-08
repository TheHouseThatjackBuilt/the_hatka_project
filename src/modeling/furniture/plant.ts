import { TAU, type ModelBuilder } from '../core/builder.ts';

export function plant(
  model: ModelBuilder,
  name: string,
  x: number,
  z: number,
  radius = 0.15,
  base = 0,
  height = 0.65,
) {
  model.cylinder(`${name} pot`, x, z, radius, 0.25, 'terra', base);
  for (let i = 0; i < 5; i++) {
    const angle = (i * TAU) / 5;
    model.ellipsoid(
      `${name} leaf`,
      x + Math.cos(angle) * radius * 0.6,
      z + Math.sin(angle) * radius * 0.6,
      radius * 1.2,
      radius * 0.7,
      height * 0.55,
      'green',
      base + 0.23 + height * 0.1 * (i % 2),
      angle,
    );
  }
}
