import { CEILING_HEIGHT, type ModelBuilder } from '../core/builder.ts';
import { roundTo } from '../core/round.ts';

export function createArchitecture(model: ModelBuilder) {
  const { box, cylinder, add } = model;

  function wall(
    name: string,
    x: number,
    z: number,
    w: number,
    d: number,
    base = 0,
    h = CEILING_HEIGHT,
  ) {
    box(name, x, z, w, d, h, 'wall', base, 'walls');
  }

  function windowX(name: string, a: number, b: number, z: number, sill = 0.85, head = 2.35) {
    for (const x of [a, b - 0.05])
      box(`${name} jamb`, x, z - 0.045, 0.05, 0.09, head - sill, 'white', sill, 'windows');
    for (const h of [sill, head - 0.05])
      box(`${name} rail`, a, z - 0.045, b - a, 0.09, 0.05, 'white', h, 'windows');
    const count = Math.max(2, roundTo((b - a) / 0.65));
    for (let i = 1; i < count; i++)
      box(
        `${name} mullion`,
        a + ((b - a) * i) / count - 0.025,
        z - 0.035,
        0.05,
        0.07,
        head - sill,
        'white',
        sill,
        'windows',
      );
    box(
      `${name} glazing`,
      a + 0.03,
      z - 0.008,
      b - a - 0.06,
      0.016,
      head - sill - 0.06,
      'glass',
      sill + 0.03,
      'windows',
    );
    box(
      `${name} ledge`,
      a - 0.04,
      z - 0.17,
      b - a + 0.08,
      0.3,
      0.04,
      'stone',
      sill - 0.04,
      'windows',
    );
  }

  function windowZ(name: string, x: number, a: number, b: number, sill = 0.85, head = 2.35) {
    for (const z of [a, b - 0.05])
      box(`${name} jamb`, x - 0.045, z, 0.09, 0.05, head - sill, 'white', sill, 'windows');
    for (const h of [sill, head - 0.05])
      box(`${name} rail`, x - 0.045, a, 0.09, b - a, 0.05, 'white', h, 'windows');
    const count = Math.max(2, roundTo((b - a) / 0.65));
    for (let i = 1; i < count; i++)
      box(
        `${name} mullion`,
        x - 0.035,
        a + ((b - a) * i) / count - 0.025,
        0.07,
        0.05,
        head - sill,
        'white',
        sill,
        'windows',
      );
    box(
      `${name} glazing`,
      x - 0.008,
      a + 0.03,
      0.016,
      b - a - 0.06,
      head - sill - 0.06,
      'glass',
      sill + 0.03,
      'windows',
    );
  }

  /** lo/hi are measured along the wall's long axis, relative to its start. */
  function openingWall(
    name: string,
    x: number,
    z: number,
    w: number,
    d: number,
    axis: 'x' | 'z',
    lo: number,
    hi: number,
    sill = 0,
    head = 2.1,
    window = false,
  ) {
    const length = axis === 'x' ? w : d;
    if (axis === 'x') {
      if (lo > 0) wall(`${name} left`, x, z, lo, d);
      if (hi < length) wall(`${name} right`, x + hi, z, length - hi, d);
      if (sill) wall(`${name} sill`, x + lo, z, hi - lo, d, 0, sill);
      wall(`${name} lintel`, x + lo, z, hi - lo, d, head, CEILING_HEIGHT - head);
    } else {
      if (lo > 0) wall(`${name} upper`, x, z, w, lo);
      if (hi < length) wall(`${name} lower`, x, z + hi, w, length - hi);
      if (sill) wall(`${name} sill`, x, z + lo, w, hi - lo, 0, sill);
      wall(`${name} lintel`, x, z + lo, w, hi - lo, head, CEILING_HEIGHT - head);
    }
    if (window) {
      if (axis === 'x') windowX(name, x + lo, x + hi, z + d / 2, sill, head);
      else windowZ(name, x + w / 2, z + lo, z + hi, sill, head);
    }
  }

  // This source-plan helper takes degrees; primitive rotations are radians.
  function door(name: string, x: number, z: number, width: number, angle: number, sliding = false) {
    const a = angle * (Math.PI / 180);
    add(
      name,
      'box',
      [x + (Math.cos(a) * width) / 2, 1.045, z + (Math.sin(a) * width) / 2],
      [width, 2.09, 0.04],
      'oak_light',
      'doors',
      -a,
    );
    if (!sliding) cylinder(`${name} hinge`, x, z, 0.017, 2.07, 'dark', 0.01, 'doors');
  }

  return { wall, windowX, windowZ, openingWall, door };
}
