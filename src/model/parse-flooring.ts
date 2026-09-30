import type { ModelFlooring } from './flooring-types.ts';
import type { ModelPart } from './types.ts';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const number = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const color = (value: unknown): value is string =>
  typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);

function product(value: unknown) {
  if (value === undefined) return true;
  if (!record(value)) return false;
  if (
    ['manufacturer', 'collection', 'article'].some(
      (key) => value[key] !== undefined && !text(value[key]),
    )
  )
    return false;
  if (value.url === undefined) return true;
  if (!text(value.url)) return false;
  try {
    return ['https:', 'http:'].includes(new URL(value.url).protocol);
  } catch {
    return false;
  }
}

export function isFlooring(value: unknown, parts: ModelPart[]): value is ModelFlooring {
  if (
    !record(value) ||
    value.version !== 1 ||
    value.status !== 'draft' ||
    !Array.isArray(value.coverings) ||
    value.coverings.length === 0 ||
    !Array.isArray(value.surfaces) ||
    value.surfaces.length === 0
  )
    return false;
  const coverings = new Set<string>();
  for (const covering of value.coverings) {
    if (
      !record(covering) ||
      !text(covering.id) ||
      coverings.has(covering.id) ||
      !text(covering.label) ||
      covering.kind !== 'porcelain-stoneware' ||
      covering.appearance !== 'wood-effect' ||
      !text(covering.source) ||
      !Array.isArray(covering.formats) ||
      covering.formats.length === 0 ||
      !record(covering.layout) ||
      !product(covering.product)
    )
      return false;
    const formats = new Set<string>();
    let smallestSide = Infinity;
    for (const format of covering.formats) {
      if (
        !record(format) ||
        !text(format.id) ||
        formats.has(format.id) ||
        !number(format.width) ||
        format.width <= 0 ||
        !number(format.length) ||
        format.length <= 0
      )
        return false;
      formats.add(format.id);
      smallestSide = Math.min(smallestSide, format.width, format.length);
    }
    const layout = covering.layout;
    if (
      (layout.formatId !== undefined &&
        (!text(layout.formatId) || !formats.has(layout.formatId))) ||
      (layout.direction !== undefined && layout.direction !== 'x' && layout.direction !== 'z') ||
      (layout.rowOffset !== undefined &&
        (!number(layout.rowOffset) || layout.rowOffset < 0 || layout.rowOffset >= 1)) ||
      (layout.groutWidth !== undefined &&
        (!number(layout.groutWidth) ||
          layout.groutWidth < 0 ||
          layout.groutWidth >= smallestSide)) ||
      (layout.groutColor !== undefined && !color(layout.groutColor)) ||
      (layout.origin !== undefined &&
        (!Array.isArray(layout.origin) ||
          layout.origin.length !== 2 ||
          !layout.origin.every(number)))
    )
      return false;
    coverings.add(covering.id);
  }
  const surfaces = new Set<string>();
  for (const surface of value.surfaces) {
    if (
      !record(surface) ||
      !text(surface.id) ||
      surfaces.has(surface.id) ||
      !text(surface.label) ||
      !text(surface.source) ||
      (surface.coveringId !== null &&
        (!text(surface.coveringId) || !coverings.has(surface.coveringId)))
    )
      return false;
    surfaces.add(surface.id);
  }
  const referenced = new Set<string>();
  for (const part of parts) {
    if (part.floorSurfaceId === undefined) continue;
    if (part.group !== 'floor' || !surfaces.has(part.floorSurfaceId)) return false;
    referenced.add(part.floorSurfaceId);
  }
  return [...surfaces].every((id) => referenced.has(id));
}
