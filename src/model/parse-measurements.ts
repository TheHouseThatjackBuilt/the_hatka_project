import type { ModelMeasurements } from './measurement-types.ts';
import type { ModelPart } from './types.ts';
import { isValidRegion } from './measurement-math.ts';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const number = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const vector = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every(number);

export function isMeasurements(value: unknown, parts: ModelPart[]): value is ModelMeasurements {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.targets) ||
    !Array.isArray(value.rooms)
  )
    return false;
  const ids = new Set<string>();
  for (const target of value.targets) {
    if (
      !record(target) ||
      !text(target.id) ||
      ids.has(target.id) ||
      !text(target.label) ||
      !['object', 'wall', 'opening'].includes(String(target.kind)) ||
      !vector(target.origin) ||
      !vector(target.size) ||
      !target.size.every((size) => size > 0) ||
      !number(target.rotation) ||
      !Array.isArray(target.footprint) ||
      target.footprint.length === 0 ||
      !target.footprint.every(isValidRegion) ||
      !text(target.planSource) ||
      !text(target.heightSource) ||
      (target.diameter !== undefined && (!number(target.diameter) || target.diameter <= 0))
    )
      return false;
    ids.add(target.id);
  }
  const referenced = new Set<string>();
  for (const part of parts) {
    if (part.measurementId === undefined) continue;
    if (!ids.has(part.measurementId)) return false;
    referenced.add(part.measurementId);
  }
  if (value.targets.some((target) => !referenced.has(target.id))) return false;
  for (const room of value.rooms) {
    if (
      !record(room) ||
      !text(room.id) ||
      ids.has(room.id) ||
      !text(room.label) ||
      !isValidRegion(room.region) ||
      !number(room.height) ||
      room.height <= 0 ||
      !text(room.source) ||
      !text(room.heightSource)
    )
      return false;
    ids.add(room.id);
  }
  return true;
}
