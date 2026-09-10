import type { ModelBuilder } from '../core/builder.ts';
import { cabinet } from '../furniture/cabinet.ts';
import { basin, bathtub, toilet } from '../furniture/bathroom.ts';
import { PLAN } from '../plan.ts';

export function buildMainBathroom(model: ModelBuilder) {
  const { box } = model;
  const p = PLAN.mainBathroom;
  bathtub(model, 'Bathroom 1 bathtub 1835 x 800', p.west, p.north, p.width, p.bathDepth);
  cabinet(
    model,
    'Bathroom 1 west double vanity',
    p.west,
    p.north + p.bathDepth + p.vanityGap,
    p.vanityDepth,
    p.vanityLength,
    0.52,
    'oak_light',
    'east',
    0.29,
  );
  box(
    'Bathroom 1 stone top',
    p.west,
    p.north + p.bathDepth + p.vanityGap,
    p.vanityDepth,
    p.vanityLength,
    0.035,
    'stone',
    0.81,
  );
  for (const [suffix, z] of [
    ['north', 4.5385],
    ['south', 5.1635],
  ] as const)
    basin(model, `Bathroom 1 basin ${suffix}`, 0.25, z, 0.55, 0.4, 0.85, -Math.PI / 2);
  toilet(model, 'Bathroom 1 WC', p.width - 0.4, 5.196, {
    width: 0.35,
    depth: 0.56,
    cistern: false,
  });
  box('Bathroom 1 installation shelf', p.west, 5.476, p.width, p.installationDepth, 1.1, 'white');
  box(
    'Bathroom 1 bath curtain rod',
    p.west,
    p.north + p.bathDepth - 0.03,
    p.width,
    0.03,
    0.03,
    'dark',
    2.05,
  );
}
