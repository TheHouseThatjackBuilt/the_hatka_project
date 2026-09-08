import type { ModelBuilder } from '../core/builder.ts';

export function buildFloors(model: ModelBuilder) {
  const { box } = model;
  // The entrance extension and the right balcony are explicit in the footprint.
  for (const [name, x, z, w, d] of [
    ['Main floor slab', -0.24, -0.24, 10.472, 7.3],
    ['Entrance extension slab', -0.24, 7.06, 3.635, 1.2],
    ['Entrance corner slab', -0.24, 6.82, 3.635, 0.24],
    ['Balcony slab', 10.232, 4.02, 1.0, 2.58],
  ] as const) {
    box(name, x, z, w, d, 0.18, 'slab', -0.18, 'floor');
  }
  box('Timber floor main', 0, 0, 9.982, 6.82, 0.018, 'floor', 0, 'floor');
  box('Timber floor entrance', 0, 6.82, 3.155, 1.2, 0.018, 'floor', 0, 'floor');
  box('Balcony surface', 10.232, 4.02, 1.0, 2.58, 0.025, 'tile', 0, 'floor');
  for (const [name, x, z, w, d] of [
    ['Bathroom 1', 0, 3.15, 1.835, 2.49],
    ['Bathroom 2', 5.004, 5.08, 1.58, 1.74],
    ['Entrance tile', 1.955, 5.76, 1.2, 2.26],
  ] as const) {
    box(`${name} floor`, x, z, w, d, 0.019, 'tile', 0.003, 'floor');
    for (let i = 1; i <= Math.trunc(w / 0.6); i++)
      box(`${name} grout`, x + i * 0.6, z, 0.006, d, 0.003, 'tilejoint', 0.022, 'floor');
    for (let i = 1; i <= Math.trunc(d / 0.6); i++)
      box(`${name} grout`, x, z + i * 0.6, w, 0.006, 0.003, 'tilejoint', 0.022, 'floor');
  }
  for (let i = 1; i < 35; i++) {
    const x = i * 0.285;
    if (x < 9.98)
      box('Timber longitudinal joint', x, 0, 0.005, 6.82, 0.002, 'joint', 0.018, 'floor');
    for (let j = 1; j < 5; j++) {
      const z = j * 1.65 + (i % 3) * 0.38;
      if (z < 6.82)
        box('Timber board end', x - 0.28, z, 0.28, 0.004, 0.002, 'joint', 0.018, 'floor');
    }
  }
}
