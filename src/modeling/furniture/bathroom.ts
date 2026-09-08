import type { ModelBuilder } from '../core/builder.ts';

/** Wall-to-wall shower with sliding entry at the north end of the west partition. */
export function walkInShower(
  model: ModelBuilder,
  name: string,
  x: number,
  z: number,
  w: number,
  d: number,
) {
  const { box, cylinder } = model;
  box(`${name} tray`, x, z, w, d, 0.04, 'stone', 0.02);
  box(`${name} tiled floor`, x + 0.025, z + 0.02, w - 0.05, d - 0.04, 0.012, 'tile', 0.06);
  box(`${name} linear drain`, x + w - 0.085, z + 0.12, 0.035, d - 0.24, 0.006, 'dark', 0.073);
  box(`${name} east wall tile`, x + w - 0.018, z, 0.018, d, 2.2, 'tile', 0.02);
  for (const tileZ of [z + 0.58, z + 1.16]) {
    box(`${name} wall grout`, x + w - 0.021, tileZ, 0.003, 0.004, 2.2, 'tilejoint', 0.02);
  }
  box(`${name} fixed glass`, x + 0.022, z + 0.7, 0.012, d - 0.72, 2.05, 'showerglass', 0.075);
  box(`${name} sliding glass door`, x + 0.05, z + 0.02, 0.012, 0.72, 2.05, 'showerglass', 0.075);
  for (const railBase of [0.065, 2.125]) {
    box(`${name} sliding rail`, x + 0.015, z + 0.015, 0.055, d - 0.03, 0.022, 'dark', railBase);
  }
  for (const postZ of [z + 0.02, z + d - 0.04]) {
    box(`${name} end post`, x + 0.022, postZ, 0.022, 0.02, 2.05, 'dark', 0.075);
  }
  box(`${name} door handle`, x + 0.018, z + 0.12, 0.024, 0.018, 0.28, 'dark', 0.84);
  cylinder(`${name} riser`, x + w - 0.075, z + d * 0.6, 0.014, 1.12, 'dark', 1.01);
  box(`${name} mixer`, x + w - 0.12, z + d * 0.6 - 0.1, 0.055, 0.2, 0.05, 'dark', 0.98);
  box(`${name} rain arm`, x + w - 0.34, z + d * 0.6 - 0.014, 0.28, 0.028, 0.026, 'dark', 2.11);
  cylinder(`${name} rain head`, x + w - 0.34, z + d * 0.6, 0.13, 0.025, 'dark', 2.085);
}

export function toilet(model: ModelBuilder, name: string, x: number, z: number) {
  const { box, ellipsoid } = model;
  box(`${name} cistern wall`, x - 0.3, z + 0.24, 0.6, 0.16, 1.1, 'white');
  ellipsoid(`${name} bowl`, x, z, 0.37, 0.58, 0.3, 'white', 0.16);
  ellipsoid(`${name} seat`, x, z - 0.04, 0.38, 0.47, 0.045, 'white', 0.44);
  ellipsoid(`${name} opening`, x, z - 0.055, 0.245, 0.33, 0.015, 'dark', 0.468);
  box(`${name} flush`, x - 0.085, z + 0.228, 0.17, 0.016, 0.085, 'dark', 0.91);
}

/** Open bath with recessed floor, four sides and an overhanging rim. */
export function bathtub(
  model: ModelBuilder,
  name: string,
  x: number,
  z: number,
  w = 1.7,
  d = 0.7,
  h = 0.6,
) {
  const { box, cylinder } = model;
  box(`${name} base`, x, z, w, d, 0.12, 'white', 0.04);
  box(`${name} back`, x, z, w, 0.075, h - 0.16, 'white', 0.16);
  box(`${name} apron`, x, z + d - 0.075, w, 0.075, h - 0.16, 'white', 0.16);
  for (const [suffix, sideX] of [
    ['left end', x],
    ['right end', x + w - 0.1],
  ] as const) {
    box(`${name} ${suffix}`, sideX, z + 0.075, 0.1, d - 0.15, h - 0.16, 'white', 0.16);
  }
  box(`${name} recessed floor`, x + 0.1, z + 0.075, w - 0.2, d - 0.15, 0.025, 'white', 0.16);
  for (const [suffix, rimZ] of [
    ['back rim', z],
    ['front rim', z + d - 0.105],
  ] as const) {
    box(`${name} ${suffix}`, x, rimZ, w, 0.105, 0.025, 'white', h - 0.01);
  }
  for (const [suffix, rimX] of [
    ['left rim', x],
    ['right rim', x + w - 0.15],
  ] as const) {
    box(`${name} ${suffix}`, rimX, z + 0.105, 0.15, d - 0.21, 0.025, 'white', h - 0.01);
  }
  cylinder(`${name} drain`, x + w - 0.28, z + d / 2, 0.026, 0.006, 'dark', 0.186);
  box(`${name} overflow`, x + w - 0.108, z + d / 2 - 0.055, 0.012, 0.11, 0.035, 'dark', h - 0.14);
  cylinder(`${name} mixer`, x + w - 0.28, z + 0.04, 0.022, 0.16, 'dark', h + 0.015);
  box(`${name} spout`, x + w - 0.298, z + 0.025, 0.036, 0.22, 0.025, 'dark', h + 0.15);
  cylinder(`${name} spout outlet`, x + w - 0.28, z + 0.23, 0.021, 0.035, 'dark', h + 0.12);
}

export function basin(
  model: ModelBuilder,
  name: string,
  x: number,
  z: number,
  w = 0.5,
  d = 0.42,
  base = 0.84,
  rot = 0,
) {
  const { ellipsoid, cylinder, box, parts, rotateParts } = model;
  const firstPart = parts.length;
  ellipsoid(`${name} rim`, x, z, w, d, 0.095, 'white', base);
  ellipsoid(`${name} bowl`, x, z - 0.016, w * 0.69, d * 0.64, 0.013, 'tile', base + 0.078);
  cylinder(`${name} tap`, x, z + d * 0.44, 0.015, 0.19, 'dark', base);
  box(`${name} spout`, x - 0.014, z + d * 0.18, 0.028, d * 0.29, 0.025, 'dark', base + 0.165);
  rotateParts(firstPart, x, z, rot);
}
