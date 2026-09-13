import type { MeasurementTarget, PlanPoint, PlanRegion } from '../../model/measurement-types.ts';
import type { ModelPart, Vector3Tuple } from '../../model/types.ts';

function rotate(x: number, z: number, angle: number): PlanPoint {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return [c * x + s * z, -s * x + c * z];
}

function bounds(part: ModelPart, rotation: number) {
  const [x, z] = rotate(part.pos[0], part.pos[2], -rotation);
  const c = Math.cos(part.rot - rotation),
    s = Math.sin(part.rot - rotation);
  const rx = part.size[0] / 2,
    rz = part.size[2] / 2;
  const hx =
    part.shape === 'box' ? Math.abs(c) * rx + Math.abs(s) * rz : Math.hypot(c * rx, s * rz);
  const hz =
    part.shape === 'box' ? Math.abs(s) * rx + Math.abs(c) * rz : Math.hypot(s * rx, c * rz);
  return {
    minX: x - hx,
    maxX: x + hx,
    minZ: z - hz,
    maxZ: z + hz,
    minY: part.pos[1] - part.size[1] / 2,
    maxY: part.pos[1] + part.size[1] / 2,
  };
}

export function makeMeasurementTarget(
  selected: ModelPart[],
  spec: Pick<MeasurementTarget, 'id' | 'label' | 'kind' | 'planSource' | 'heightSource'> & {
    rotation?: number;
    diameter?: number;
  },
): MeasurementTarget {
  if (!selected.length) throw new Error(`Empty measurement target: ${spec.id}`);
  if (selected.some((p) => p.measurementId))
    throw new Error(`Overlapping measurement membership: ${spec.id}`);
  const rotation = spec.rotation ?? 0;
  const boxes = selected.map((p) => bounds(p, rotation));
  const minX = Math.min(...boxes.map((p) => p.minX)),
    maxX = Math.max(...boxes.map((p) => p.maxX));
  const minY = Math.min(...boxes.map((p) => p.minY)),
    maxY = Math.max(...boxes.map((p) => p.maxY));
  const minZ = Math.min(...boxes.map((p) => p.minZ)),
    maxZ = Math.max(...boxes.map((p) => p.maxZ));
  const centre: PlanPoint = [(minX + maxX) / 2, (minZ + maxZ) / 2];
  const world = rotate(...centre, rotation);
  const origin: Vector3Tuple = [world[0], (minY + maxY) / 2, world[1]];
  const footprint: PlanRegion[] = selected.map((part) => {
    const position = rotate(part.pos[0], part.pos[2], -rotation);
    const x = position[0] - centre[0],
      z = position[1] - centre[1];
    const rx = part.size[0] / 2,
      rz = part.size[2] / 2;
    let local: PlanPoint[];
    if (part.shape === 'box')
      local = [
        [-rx, -rz],
        [rx, -rz],
        [rx, rz],
        [-rx, rz],
      ];
    else {
      const radius = Math.max(rx, rz);
      const count = Math.max(
        32,
        Math.ceil(Math.PI / Math.acos(1 - Math.min(0.0005 / radius, 1)) / 4) * 4,
      );
      local = Array.from({ length: count }, (_, i) => [
        rx * Math.cos((i * 2 * Math.PI) / count),
        rz * Math.sin((i * 2 * Math.PI) / count),
      ]);
    }
    const outer = local.map(([px, pz]): PlanPoint => {
      const p = rotate(px, pz, part.rot - rotation);
      return [x + p[0], z + p[1]];
    });
    part.measurementId = spec.id;
    return { outer };
  });
  return { ...spec, origin, rotation, size: [maxX - minX, maxY - minY, maxZ - minZ], footprint };
}
