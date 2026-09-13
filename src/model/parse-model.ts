import type { ApartmentModel, ModelMaterial, ModelPart, RoomLabel, Vector3Tuple } from './types.ts';
import { isMeasurements } from './parse-measurements.ts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isVector = (value: unknown): value is Vector3Tuple =>
  Array.isArray(value) && value.length === 3 && value.every(isNumber);

function isMaterial(value: unknown): value is ModelMaterial {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'string' &&
    /^#[\da-f]{6}$/i.test(value[1]) &&
    isNumber(value[2]) &&
    value[2] >= 0 &&
    value[2] <= 1
  );
}

function isPart(value: unknown): value is ModelPart {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    ['box', 'cylinder', 'sphere'].some((shape) => shape === value.shape) &&
    ['floor', 'walls', 'windows', 'doors', 'furniture', 'balcony', 'ceiling'].some(
      (group) => group === value.group,
    ) &&
    isVector(value.pos) &&
    isVector(value.size) &&
    value.size.every((size) => size > 0) &&
    typeof value.mat === 'string' &&
    (value.measurementId === undefined ||
      (typeof value.measurementId === 'string' && value.measurementId.trim().length > 0)) &&
    isNumber(value.rot)
  );
}

function isLabel(value: unknown): value is RoomLabel {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    typeof value[0] === 'string' &&
    isNumber(value[1]) &&
    isNumber(value[2])
  );
}

function isModel(value: unknown): value is ApartmentModel {
  if (!isRecord(value) || !isRecord(value.metadata) || !isRecord(value.materials)) return false;
  const { metadata, materials } = value;
  return (
    typeof metadata.title === 'string' &&
    metadata.units === 'metres' &&
    isNumber(metadata.ceilingHeight) &&
    metadata.ceilingHeight > 0 &&
    typeof metadata.coordinateSystem === 'string' &&
    typeof metadata.source === 'string' &&
    typeof metadata.status === 'string' &&
    Object.values(materials).every(isMaterial) &&
    Array.isArray(value.parts) &&
    value.parts.length > 0 &&
    value.parts.every((part: unknown) => isPart(part) && Object.hasOwn(materials, part.mat)) &&
    Array.isArray(value.labels) &&
    value.labels.every(isLabel) &&
    (value.measurements === undefined
      ? value.parts.every((part: ModelPart) => part.measurementId === undefined)
      : isMeasurements(value.measurements, value.parts))
  );
}

// JSON is an untyped boundary: reject malformed geometry before creating GPU resources.
export function parseApartmentModel(value: unknown): ApartmentModel {
  if (!isModel(value)) throw new Error('Invalid apartment model data');
  return value;
}
