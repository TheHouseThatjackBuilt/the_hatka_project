import type { ModelBuilder } from '../core/builder.ts';
import { createArchitecture } from './openings.ts';

export function buildWalls(model: ModelBuilder) {
  const { box } = model;
  const { wall, windowX, windowZ, openingWall, door } = createArchitecture(model);
  const northSegments = [
    [-0.24, 0.58],
    [0.58, 2.46],
    [2.46, 3.51],
    [3.51, 5.11],
    [5.11, 7.09],
    [7.09, 8.68],
    [8.68, 10.232],
  ] as const;
  for (const [i, [a, b]] of northSegments.entries()) {
    if ([1, 3, 5].includes(i)) {
      wall(`North window sill ${i}`, a, -0.24, b - a, 0.24, 0, 0.85);
      wall(`North window lintel ${i}`, a, -0.24, b - a, 0.24, 2.35, 0.35);
      windowX(`North window ${i}`, a, b, -0.12);
    } else wall(`North exterior ${i}`, a, -0.24, b - a, 0.24);
  }
  wall('West exterior', -0.24, 0, 0.24, 8.02);
  openingWall('East study wall', 9.982, 0, 0.25, 3.43, 'z', 0.52, 2.64, 0.85, 2.35, true);
  openingWall('East bedroom wall', 9.982, 3.43, 0.25, 3.39, 'z', 1.47, 2.42, 0, 2.2);
  windowZ('Balcony door glazing', 10.105, 4.9, 5.85, 0.1, 2.18);
  door('Balcony door open', 9.99, 4.9, 0.91, 180);
  wall('South main exterior', 3.155, 6.82, 7.077, 0.24);
  wall('Entrance east exterior', 3.155, 6.82, 0.24, 1.44);
  wall('South cloakroom exterior', -0.24, 8.02, 2.195, 0.24);
  openingWall('Entrance door wall', 1.955, 8.02, 1.2, 0.24, 'x', 0.05, 1.03, 0, 2.1);
  door('Entry door open', 2.985, 8.145, 0.98, 95);
  // Railing height is inferred; the envelope follows the photographed plan.
  box('Balcony railing east', 11.2, 4.02, 0.035, 2.58, 1.05, 'dark', 0, 'balcony');
  for (const z of [4.02, 6.565])
    box('Balcony railing return', 10.232, z, 1.0, 0.035, 1.05, 'glass', 0, 'balcony');
  box('Balcony glass guard', 11.18, 4.06, 0.018, 2.5, 0.92, 'glass', 0.04, 'balcony');

  // Shared partitions are authored once, independently of room furniture.
  wall('Living room pier / x=3.122', 3.122, 0, 0.24, 1.12);
  openingWall('Study partition with door', 6.554, 0, 0.15, 3.18, 'z', 0.08, 1.0, 0, 2.1);
  door('Study door open', 6.629, 0.08, 0.92, 180);
  wall('Kitchen and bedroom transverse wall', 3.122, 3.18, 6.86, 0.25);
  wall('Kitchen west return', 3.122, 2.39, 0.24, 2.31);
  wall('Hall storage return', 3.122, 4.7, 0.58, 0.15);
  wall('Hall storage east cheek', 3.58, 3.43, 0.12, 1.42);
  wall('Bedroom entrance upper pier', 6.554, 3.43, 0.15, 0.65);
  wall('Bedroom ensuite partition', 6.584, 4.98, 0.12, 1.84);
  wall('Bedroom door lintel', 6.584, 4.08, 0.12, 0.9, 2.1, 0.6);
  door('Bedroom sliding leaf open', 6.722, 5.82, 0.9, -90, true);
  wall('Bathroom 1 north wall', 0, 3.03, 1.955, 0.12);
  openingWall('Bathroom 1 east wall', 1.835, 3.15, 0.12, 2.49, 'z', 0.7, 1.5, 0, 2.1);
  door('Bathroom 1 door open', 1.895, 4.65, 0.8, 0);
  wall('Bathroom 1 south wall', 0, 5.64, 1.955, 0.12);
  wall('Cloakroom east upper', 1.835, 5.76, 0.12, 1.1);
  wall('Cloakroom east lower', 1.835, 7.66, 0.12, 0.36);
  wall('Cloakroom door lintel', 1.835, 6.86, 0.12, 0.8, 2.1, 0.6);
  door('Cloakroom door open', 1.895, 7.66, 0.8, 180);
  wall('Ensuite west wall', 4.884, 5.08, 0.12, 1.74);
  openingWall('Ensuite north wall', 4.884, 4.96, 1.82, 0.12, 'x', 0.12, 0.92, 0, 2.1);
  door('Ensuite door open', 5.004, 5.02, 0.8, -90);
  wall('Utility south nib', 3.155, 6.18, 1.729, 0.12);
}
