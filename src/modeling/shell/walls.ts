import type { ModelBuilder } from '../core/builder.ts';
import { PLAN } from '../plan.ts';
import { createArchitecture } from './openings.ts';

export function buildWalls(model: ModelBuilder) {
  const { box } = model;
  const { wall, windowZ, openingWall, door } = createArchitecture(model);
  const { exterior: e, living: l, kitchen: k, study: s, bedroom: b, hall: h } = PLAN;
  const t = e.thickness;
  let northX = -t;
  for (const [i, [start, end]] of PLAN.northWindows.entries()) {
    wall(`North exterior ${i}`, northX, -t, start - northX, t);
    openingWall(
      `North window ${i + 1}`,
      start,
      -t,
      end - start,
      t,
      'x',
      0,
      end - start,
      0.85,
      2.35,
      true,
    );
    northX = end;
  }
  wall('North exterior east end', northX, -t, e.east + t - northX, t);
  wall('West exterior', -t, 0, t, e.entranceOuterSouth);
  openingWall(
    'East study wall',
    e.east,
    0,
    t,
    PLAN.transverseWall.south,
    'z',
    ...PLAN.eastWindow,
    0.85,
    2.35,
    true,
  );

  const balcony = PLAN.balcony;
  openingWall(
    'East bedroom wall',
    e.east,
    PLAN.transverseWall.south,
    t,
    e.bedroomSouth - PLAN.transverseWall.south,
    'z',
    balcony.openingNorth - PLAN.transverseWall.south,
    balcony.openingSouth - PLAN.transverseWall.south,
    0,
    2.2,
  );
  // The source shows an 860 mm open leaf and a separate fixed lower pane.
  windowZ(
    'Balcony fixed glazing',
    e.east + 0.1925,
    balcony.fixedGlazingNorth,
    balcony.openingSouth - 0.04,
    0.1,
    2.18,
  );
  door('Balcony door open', e.east + 0.135, balcony.openingNorth + 0.04, balcony.doorLeaf, 180);
  wall(
    'South utility exterior',
    e.entranceEast,
    e.utilitySouth,
    b.west - e.entranceEast,
    e.south - e.utilitySouth,
  );
  wall(
    'South bedroom exterior',
    b.west,
    e.bedroomSouth,
    e.east + t - b.west,
    e.south - e.bedroomSouth,
  );
  wall(
    'Entrance east exterior',
    e.entranceEast,
    e.utilitySouth,
    t,
    e.entranceOuterSouth - e.utilitySouth,
  );
  openingWall(
    'Entrance door wall',
    -t,
    e.entranceSouth,
    e.entranceEast + 2 * t,
    e.entranceOuterSouth - e.entranceSouth,
    'x',
    h.entranceDoor.x + t,
    h.entranceDoor.x + t + h.entranceDoor.width,
    0,
    2.1,
  );
  // Vector-defined entry recess; the jamb remains a full 1000 mm opening.
  wall('Entrance east nib', 2.875, 7.541, e.entranceEast - 2.875, 0.12);
  wall('Entrance east nib return', 2.875, 7.661, 0.12, e.entranceSouth - 7.661);
  door(
    'Entry door open',
    h.entranceDoor.x + h.entranceDoor.width - 0.032,
    e.entranceOuterSouth,
    h.entranceDoor.leaf,
    90,
  );

  const balconyX = e.east + t;
  // Guard/slab heights are retained visual assumptions: this sheet is a plan.
  box(
    'Balcony railing east',
    balconyX + balcony.width - balcony.guardThickness,
    balcony.north,
    balcony.guardThickness,
    balcony.south - balcony.north,
    1.05,
    'dark',
    0,
    'balcony',
  );
  for (const z of [balcony.north, balcony.south - balcony.guardThickness])
    box(
      'Balcony railing return',
      balconyX,
      z,
      balcony.width - balcony.guardThickness,
      balcony.guardThickness,
      1.05,
      'glass',
      0,
      'balcony',
    );
  box(
    'Balcony glass guard',
    balconyX + balcony.width - 0.035,
    balcony.north + balcony.guardThickness,
    0.018,
    balcony.south - balcony.north - 2 * balcony.guardThickness,
    0.92,
    'glass',
    0.04,
    'balcony',
  );

  wall('Living room north pier', l.pierX, 0, l.pierThickness, l.pierEnd);
  wall(
    'Kitchen west return',
    l.pierX,
    l.pierEnd + l.passage,
    l.pierThickness,
    h.returnSouth - l.pierEnd - l.passage,
  );
  openingWall(
    'Study partition with door',
    k.east,
    0,
    s.partition,
    s.south,
    'z',
    s.doorStart,
    s.doorStart + s.doorWidth,
    0,
    2.1,
  );
  door('Study door open', k.east + 0.03, s.doorStart + 0.04, s.doorWidth - 0.08, 180);
  wall(
    'Kitchen and bedroom transverse wall',
    k.west,
    PLAN.transverseWall.north,
    e.east - k.west,
    PLAN.transverseWall.thickness,
  );
  wall(
    'Hall storage return',
    k.west,
    h.returnNorth,
    h.cheekX + h.cheekThickness - k.west,
    h.returnSouth - h.returnNorth,
  );
  wall(
    'Hall storage east cheek',
    h.cheekX,
    PLAN.transverseWall.south,
    h.cheekThickness,
    h.returnNorth - PLAN.transverseWall.south,
  );
  openingWall(
    'Hall utility entrance wall',
    l.pierX,
    h.returnSouth,
    l.pierThickness,
    e.utilitySouth - h.returnSouth,
    'z',
    h.doorStart - h.returnSouth,
    h.doorStart + h.doorWidth - h.returnSouth,
    0,
    2.1,
  );
  door(
    'Hall utility door open',
    l.pierX,
    h.doorStart + h.doorWidth - 0.04,
    h.doorWidth - 0.08,
    180,
  );

  wall(
    'Bedroom entrance upper pier',
    b.partitionX,
    PLAN.transverseWall.south,
    b.partition,
    b.doorStart - PLAN.transverseWall.south,
  );
  wall('Bedroom door lintel', b.partitionX, b.doorStart, b.partition, b.doorWidth, 2.1, 0.6);
  const pocketStart = b.doorStart + b.doorWidth;
  const leaf = b.doorWidth - 0.1;
  const cheek = (b.partition - 0.05) / 2;
  // Two cheeks leave a real 50 mm pocket for the 40 mm sliding leaf.
  for (const x of [b.partitionX, b.west - cheek])
    wall('Bedroom sliding pocket cheek', x, pocketStart, cheek, leaf, 0, 2.1);
  wall('Bedroom sliding pocket lintel', b.partitionX, pocketStart, b.partition, leaf, 2.1, 0.6);
  wall(
    'Bedroom ensuite partition',
    b.partitionX,
    pocketStart + leaf,
    b.partition,
    e.south - pocketStart - leaf,
  );
  door(
    'Bedroom sliding leaf open',
    b.partitionX + b.partition / 2,
    pocketStart + leaf,
    leaf,
    -90,
    true,
  );

  const bath = PLAN.mainBathroom;
  const bathSouth =
    bath.north + bath.bathDepth + bath.vanityGap + bath.vanityLength + bath.installationDepth;
  wall(
    'Bathroom 1 north wall',
    0,
    bath.north - bath.partition,
    bath.width + bath.partition,
    bath.partition,
  );
  openingWall(
    'Bathroom 1 east wall',
    bath.width,
    bath.north,
    bath.partition,
    bathSouth - bath.north,
    'z',
    bath.doorStart - bath.north,
    bath.doorStart + bath.doorWidth - bath.north,
    0,
    2.1,
  );
  door(
    'Bathroom 1 door open',
    bath.width + bath.partition,
    bath.doorStart + bath.doorWidth - 0.04,
    bath.doorWidth - 0.08,
    0,
  );
  wall('Bathroom 1 south wall', 0, bathSouth, bath.width + bath.partition, bath.partition);

  const cloak = PLAN.cloakroom;
  openingWall(
    'Cloakroom east wall',
    cloak.width,
    cloak.northStorageZ,
    cloak.partition,
    e.entranceSouth - cloak.northStorageZ,
    'z',
    cloak.doorStart - cloak.northStorageZ,
    cloak.doorStart + cloak.doorWidth - cloak.northStorageZ,
    0,
    2.1,
  );
  wall(
    'Cloakroom north storage partition',
    0,
    cloak.northStorageZ + cloak.northStorageDepth,
    cloak.width,
    cloak.partition,
  );
  wall(
    'Cloakroom south storage partition',
    0,
    cloak.southPartitionZ,
    cloak.width,
    cloak.southPartitionDepth,
  );
  door(
    'Cloakroom door open',
    cloak.width - 0.015,
    cloak.doorStart + cloak.doorWidth - 0.04,
    cloak.doorWidth - 0.08,
    180,
  );

  const en = PLAN.ensuite;
  wall('Ensuite west wall', en.westWall, en.north, en.partition, en.south - en.north);
  openingWall(
    'Ensuite north wall',
    en.westWall,
    en.northWall,
    en.partition + en.toiletWidth + en.bathWidth,
    en.partition,
    'x',
    en.partition,
    en.partition + en.doorWidth,
    0,
    2.1,
  );
  door('Ensuite door open', en.west + 0.04, en.north - 0.115, en.doorWidth - 0.08, -90);
  wall('Utility south nib', l.pierX, h.utilitySouthWall, en.westWall - l.pierX, en.partition);
}
