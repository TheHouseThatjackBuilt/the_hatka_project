import type { ModelBuilder } from '../core/builder.ts';
import { PLAN } from '../plan.ts';

export function buildFloors(model: ModelBuilder) {
  const { box } = model;
  const { exterior: e, balcony, mainBathroom: bath, ensuite: en } = PLAN;
  const t = e.thickness;
  const balconyX = e.east + t;
  for (const [name, x, z, w, d] of [
    ['Main floor slab', -t, -t, e.east + 2 * t, e.south + t],
    [
      'Entrance extension slab',
      -t,
      e.south,
      e.entranceEast + 2 * t,
      e.entranceOuterSouth - e.south,
    ],
    ['Balcony slab', balconyX, balcony.north, balcony.width, balcony.south - balcony.north],
  ] as const)
    box(name, x, z, w, d, 0.18, 'slab', -0.18, 'floor');

  box('Timber floor main', 0, 0, e.east, e.utilitySouth, 0.018, 'floor', 0, 'floor');
  box(
    'Timber floor bedroom south',
    PLAN.bedroom.west,
    e.utilitySouth,
    e.east - PLAN.bedroom.west,
    e.bedroomSouth - e.utilitySouth,
    0.018,
    'floor',
    0,
    'floor',
  );
  box(
    'Timber floor entrance',
    0,
    e.utilitySouth,
    e.entranceEast,
    e.entranceSouth - e.utilitySouth,
    0.018,
    'floor',
    0,
    'floor',
  );
  box(
    'Balcony surface',
    balconyX,
    balcony.north,
    balcony.width,
    balcony.south - balcony.north,
    0.025,
    'tile',
    0,
    'floor',
  );
  box(
    'Balcony threshold',
    e.east,
    balcony.openingNorth,
    t,
    balcony.openingSouth - balcony.openingNorth,
    0.025,
    'stone',
    0,
    'floor',
  );
  box(
    'Entrance threshold',
    PLAN.hall.entranceDoor.x,
    e.entranceSouth,
    PLAN.hall.entranceDoor.width,
    e.entranceOuterSouth - e.entranceSouth,
    0.025,
    'stone',
    0,
    'floor',
  );

  for (const [name, x, z, w, d] of [
    [
      'Bathroom 1',
      bath.west,
      bath.north,
      bath.width,
      bath.bathDepth + bath.vanityGap + bath.vanityLength + bath.installationDepth,
    ],
    ['Bathroom 2', en.west, en.north, en.toiletWidth + en.bathWidth, en.south - en.north],
    [
      'Entrance tile',
      bath.width + bath.partition,
      PLAN.cloakroom.northStorageZ,
      e.entranceEast - bath.width - bath.partition,
      e.entranceSouth - PLAN.cloakroom.northStorageZ,
    ],
  ] as const) {
    box(`${name} floor`, x, z, w, d, 0.019, 'tile', 0.003, 'floor');
    for (let i = 1; i * 0.6 < w; i++)
      box(`${name} grout`, x + i * 0.6, z, 0.006, d, 0.003, 'tilejoint', 0.022, 'floor');
    for (let i = 1; i * 0.6 < d; i++)
      box(`${name} grout`, x, z + i * 0.6, w, 0.006, 0.003, 'tilejoint', 0.022, 'floor');
  }
  // Board and tile patterns are visual finishes, not measured construction joints.
  for (let i = 1; i * 0.285 < e.east; i++) {
    const x = i * 0.285;
    const depth = x >= PLAN.bedroom.west ? e.bedroomSouth : e.utilitySouth;
    box('Timber longitudinal joint', x, 0, 0.005, depth, 0.002, 'joint', 0.018, 'floor');
    for (let j = 1; j < 5; j++) {
      const z = j * 1.65 + (i % 3) * 0.38;
      if (z < depth)
        box('Timber board end', x - 0.28, z, 0.28, 0.004, 0.002, 'joint', 0.018, 'floor');
    }
  }
}
