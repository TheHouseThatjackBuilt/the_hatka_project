import type { ModelGroup, ModelPart, ModelShape, Vector3Tuple } from '../../model/types.ts';
import type { MaterialId } from './materials.ts';
import { roundTo } from './round.ts';

// Source-plan coordinates: X right, Y up, Z down; all lengths are metres.
export const CEILING_HEIGHT = 2.7;
export const TAU = Math.PI * 2;

export function createModelBuilder() {
  const parts: ModelPart[] = [];

  function add(
    name: string,
    shape: ModelShape,
    pos: Vector3Tuple,
    size: Vector3Tuple,
    mat: MaterialId,
    group: ModelGroup = 'furniture',
    rot = 0,
  ) {
    if (
      !pos.every(Number.isFinite) ||
      !size.every((value) => Number.isFinite(value) && value > 0) ||
      !Number.isFinite(rot)
    ) {
      throw new Error(`Invalid geometry: ${name}`);
    }
    const dimensions = size.map((value) => roundTo(value, 5)) as Vector3Tuple;
    if (dimensions.some((value) => value <= 0))
      throw new Error(`Dimensions round to zero: ${name}`);
    parts.push({
      name,
      shape,
      pos: pos.map((value) => roundTo(value, 5)) as Vector3Tuple,
      size: dimensions,
      mat,
      group,
      rot: roundTo(rot, 6),
    });
  }

  // Boxes use the plan's top-left corner; cylinders and ellipsoids use their centre.
  function box(
    name: string,
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    mat: MaterialId = 'wall',
    base = 0,
    group: ModelGroup = 'furniture',
    rot = 0,
  ) {
    add(name, 'box', [x + w / 2, base + h / 2, z + d / 2], [w, h, d], mat, group, rot);
  }

  function cylinder(
    name: string,
    x: number,
    z: number,
    radius: number,
    h: number,
    mat: MaterialId = 'oak',
    base = 0,
    group: ModelGroup = 'furniture',
  ) {
    add(name, 'cylinder', [x, base + h / 2, z], [radius * 2, h, radius * 2], mat, group);
  }

  function ellipsoid(
    name: string,
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    mat: MaterialId = 'linen',
    base = 0,
    rot = 0,
    group: ModelGroup = 'furniture',
  ) {
    add(name, 'sphere', [x, base + h / 2, z], [w, h, d], mat, group, rot);
  }

  function rotateParts(firstPart: number, x: number, z: number, rot: number) {
    if (!rot) return;
    const cosine = Math.cos(rot),
      sine = Math.sin(rot);
    for (const part of parts.slice(firstPart)) {
      const dx = part.pos[0] - x,
        dz = part.pos[2] - z;
      part.pos[0] = roundTo(x + cosine * dx + sine * dz, 5);
      part.pos[2] = roundTo(z - sine * dx + cosine * dz, 5);
      part.rot = roundTo(part.rot + rot, 6);
    }
  }

  return { parts, add, box, cylinder, ellipsoid, rotateParts };
}

export type ModelBuilder = ReturnType<typeof createModelBuilder>;
