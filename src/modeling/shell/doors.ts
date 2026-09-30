import type { ModelBuilder } from '../core/builder.ts';
import { PLAN } from '../plan.ts';

/** User heights (2026-09-30); remaining dimensions are permitted visual approximations. */
export const DOOR_DESIGN = {
  concealedLeafHeight: 2.4,
  glazedHeight: 2.55,
  floorY: 0.024,
  concealedGap: 0.004,
  concealedThickness: 0.04,
  frameWidth: 0.028,
  frameDepth: 0.05,
  leafBorder: 0.022,
  leafDepth: 0.038,
  muntin: 0.01,
  glassThickness: 0.008,
  leafGap: 0.004,
  centreGap: 0.006,
  bottomGap: 0.008,
  columns: 2,
  rows: 9,
} as const;

export const CONCEALED_HEAD =
  DOOR_DESIGN.floorY + DOOR_DESIGN.concealedLeafHeight + 2 * DOOR_DESIGN.concealedGap;

export const DOOR_ASSEMBLIES = [
  {
    prefix: 'Bathroom 1 concealed door',
    id: 'door-main-bathroom',
    label: 'Большой санузел · скрытая дверь',
    rotation: Math.PI / 2,
  },
  {
    prefix: 'Cloakroom concealed door',
    id: 'door-cloakroom',
    label: 'Гардеробная · скрытая дверь',
    rotation: Math.PI / 2,
  },
  {
    prefix: 'Master cloakroom concealed door',
    id: 'door-master-cloakroom',
    label: 'Мастер-гардеробная · скрытая дверь',
    rotation: Math.PI / 2,
  },
  {
    prefix: 'Study concealed door',
    id: 'door-study',
    label: 'Кабинет · скрытая дверь',
    rotation: Math.PI / 2,
  },
  {
    prefix: 'Living glazed frame',
    id: 'door-living-frame',
    label: 'Кухня-гостиная · рама входной группы',
    rotation: 0,
  },
  {
    prefix: 'Living glazed left leaf',
    id: 'door-living-left',
    label: 'Кухня-гостиная · левая створка',
    rotation: -Math.PI / 2,
  },
  {
    prefix: 'Living glazed right leaf',
    id: 'door-living-right',
    label: 'Кухня-гостиная · правая створка',
    rotation: 0,
  },
] as const;

export function buildDoors(model: ModelBuilder) {
  const d = DOOR_DESIGN;
  const bottom = d.floorY + d.concealedGap;
  const { mainBathroom: bath, cloakroom: cloak, hall, living, study, kitchen } = PLAN;
  // Closed leaves are flush on the corridor side; no visible architraves or hinge cylinders.
  for (const [name, faceX, startZ, width, facing] of [
    [DOOR_ASSEMBLIES[0].prefix, bath.width + bath.partition, bath.doorStart, bath.doorWidth, 1],
    [DOOR_ASSEMBLIES[1].prefix, cloak.width + cloak.partition, cloak.doorStart, cloak.doorWidth, 1],
    [DOOR_ASSEMBLIES[2].prefix, living.pierX, hall.doorStart, hall.doorWidth, -1],
    [DOOR_ASSEMBLIES[3].prefix, kitchen.east, study.doorStart, study.doorWidth, -1],
  ] as const) {
    const centreX = faceX - (facing * d.concealedThickness) / 2;
    model.add(
      `${name} leaf`,
      'box',
      [centreX, bottom + d.concealedLeafHeight / 2, startZ + width / 2],
      [d.concealedThickness, d.concealedLeafHeight, width - 2 * d.concealedGap],
      'wall',
      'doors',
    );
    for (const z of [startZ + d.concealedGap / 2, startZ + width - d.concealedGap / 2])
      model.add(
        `${name} recessed seam`,
        'box',
        [faceX - facing * 0.01, d.floorY + (CONCEALED_HEAD - d.floorY) / 2, z],
        [0.014, CONCEALED_HEAD - d.floorY, d.concealedGap],
        'door_metal',
        'doors',
      );
    model.add(
      `${name} top seam`,
      'box',
      [faceX - facing * 0.01, CONCEALED_HEAD - d.concealedGap / 2, startZ + width / 2],
      [0.014, d.concealedGap, width],
      'door_metal',
      'doors',
    );
    for (const side of [-1, 1]) {
      const handleX = centreX + side * (d.concealedThickness / 2 + 0.003);
      model.add(
        `${name} handle plate ${side}`,
        'box',
        [handleX, 1.03, startZ + 0.09],
        [0.006, 0.03, 0.03],
        'door_metal',
        'doors',
      );
      model.add(
        `${name} handle lever ${side}`,
        'box',
        [handleX + side * 0.012, 1.035, startZ + 0.125],
        [0.024, 0.014, 0.09],
        'door_metal',
        'doors',
      );
    }
  }

  // Front passage, perpendicular to the 1324 mm internal kitchen/living opening.
  const west = bath.width + bath.partition;
  const east = living.pierX;
  const z = bath.north - bath.partition;
  const width = east - west;
  const top = d.floorY + d.glazedHeight;
  const frameName = DOOR_ASSEMBLIES[4].prefix;
  for (const x of [west + d.frameWidth / 2, east - d.frameWidth / 2])
    model.add(
      `${frameName} jamb`,
      'box',
      [x, d.floorY + d.glazedHeight / 2, z],
      [d.frameWidth, d.glazedHeight, d.frameDepth],
      'door_metal',
      'doors',
    );
  model.add(
    `${frameName} header`,
    'box',
    [(west + east) / 2, top - d.frameWidth / 2, z],
    [width - 2 * d.frameWidth, d.frameWidth, d.frameDepth],
    'door_metal',
    'doors',
  );
  const leafWidth = (width - 2 * d.frameWidth - 2 * d.leafGap - d.centreGap) / 2;
  const leafHeight = d.glazedHeight - d.frameWidth - d.leafGap - d.bottomGap;
  const leafBottom = d.floorY + d.bottomGap;
  const cellWidth = (leafWidth - 2 * d.leafBorder - (d.columns - 1) * d.muntin) / d.columns;
  const cellHeight = (leafHeight - 2 * d.leafBorder - (d.rows - 1) * d.muntin) / d.rows;
  for (const [name, x, rotation] of [
    [DOOR_ASSEMBLIES[5].prefix, west + d.frameWidth + d.leafGap, -Math.PI / 2],
    [DOOR_ASSEMBLIES[6].prefix, east - d.frameWidth - d.leafGap - leafWidth, 0],
  ] as const) {
    const firstPart = model.parts.length;
    for (const sideX of [x, x + leafWidth - d.leafBorder])
      model.box(
        `${name} stile`,
        sideX,
        z - d.leafDepth / 2,
        d.leafBorder,
        d.leafDepth,
        leafHeight,
        'door_metal',
        leafBottom,
        'doors',
      );
    for (const y of [leafBottom, leafBottom + leafHeight - d.leafBorder])
      model.box(
        `${name} rail`,
        x + d.leafBorder,
        z - d.leafDepth / 2,
        leafWidth - 2 * d.leafBorder,
        d.leafDepth,
        d.leafBorder,
        'door_metal',
        y,
        'doors',
      );
    model.box(
      `${name} centre muntin`,
      x + d.leafBorder + cellWidth,
      z - d.leafDepth / 2,
      d.muntin,
      d.leafDepth,
      leafHeight - 2 * d.leafBorder,
      'door_metal',
      leafBottom + d.leafBorder,
      'doors',
    );
    for (let row = 1; row < d.rows; row++)
      model.box(
        `${name} crossbar ${row}`,
        x + d.leafBorder,
        z - d.leafDepth / 2,
        leafWidth - 2 * d.leafBorder,
        d.leafDepth,
        d.muntin,
        'door_metal',
        leafBottom + d.leafBorder + row * cellHeight + (row - 1) * d.muntin,
        'doors',
      );
    for (let row = 0; row < d.rows; row++)
      for (let column = 0; column < d.columns; column++)
        model.box(
          `${name} glass ${row + 1}-${column + 1}`,
          x + d.leafBorder + column * (cellWidth + d.muntin),
          z - d.glassThickness / 2,
          cellWidth,
          d.glassThickness,
          cellHeight,
          'door_glass',
          leafBottom + d.leafBorder + row * (cellHeight + d.muntin),
          'doors',
        );
    const handleX = rotation ? x + leafWidth - d.leafBorder / 2 : x + d.leafBorder / 2;
    model.add(
      `${name} handle`,
      'box',
      [handleX, 1.08, z + (rotation ? -1 : 1) * (d.leafDepth / 2 + 0.016)],
      [0.015, 0.18, 0.032],
      'door_metal',
      'doors',
    );
    // Left opens into the corridor as in the reference; the right leaf stays closed.
    model.rotateParts(firstPart, x, z, rotation);
  }
}
