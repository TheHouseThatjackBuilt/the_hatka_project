import type { Vector3Tuple } from './types.ts';
import type { MeasurementTarget, PlanPoint, PlanRegion } from './measurement-types.ts';

const EPS = 1e-9;
const cross = (a: PlanPoint, b: PlanPoint, c: PlanPoint) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const dist2 = (a: PlanPoint, b: PlanPoint) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const rings = (r: PlanRegion) => [r.outer, ...(r.holes ?? [])];
const onSegment = (p: PlanPoint, a: PlanPoint, b: PlanPoint) =>
  Math.abs(cross(a, b, p)) <= EPS &&
  p[0] >= Math.min(a[0], b[0]) - EPS &&
  p[0] <= Math.max(a[0], b[0]) + EPS &&
  p[1] >= Math.min(a[1], b[1]) - EPS &&
  p[1] <= Math.max(a[1], b[1]) + EPS;
const properCross = (a: PlanPoint, b: PlanPoint, c: PlanPoint, d: PlanPoint) => {
  const x = cross(a, b, c),
    y = cross(a, b, d),
    u = cross(c, d, a),
    v = cross(c, d, b);
  return (
    ((x > EPS && y < -EPS) || (x < -EPS && y > EPS)) &&
    ((u > EPS && v < -EPS) || (u < -EPS && v > EPS))
  );
};
const intersects = (a: PlanPoint, b: PlanPoint, c: PlanPoint, d: PlanPoint) =>
  properCross(a, b, c, d) ||
  onSegment(a, c, d) ||
  onSegment(b, c, d) ||
  onSegment(c, a, b) ||
  onSegment(d, a, b);
const pointInRing = (p: PlanPoint, ring: PlanPoint[], boundary = true) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j]!,
      b = ring[i]!;
    if (onSegment(p, a, b)) return boundary;
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
};
const strictlyContains = (p: PlanPoint, region: PlanRegion) =>
  pointInRing(p, region.outer, false) && !(region.holes ?? []).some((h) => pointInRing(p, h, true));

export function regionContains(point: PlanPoint, region: PlanRegion): boolean {
  if (!pointInRing(point, region.outer, true)) return false;
  return !(region.holes ?? []).some((h) => pointInRing(point, h, false));
}

const signedArea = (p: PlanPoint[]) =>
  p.reduce((s, a, i) => {
    const b = p[(i + 1) % p.length]!;
    return s + a[0] * b[1] - b[0] * a[1];
  }, 0) / 2;
export function regionArea(region: PlanRegion): number {
  return Math.max(
    0,
    Math.abs(signedArea(region.outer)) -
      (region.holes ?? []).reduce((s, h) => s + Math.abs(signedArea(h)), 0),
  );
}

export function worldRegions(target: MeasurementTarget): PlanRegion[] {
  const c = Math.cos(target.rotation),
    s = Math.sin(target.rotation);
  const convert = ([x, z]: PlanPoint): PlanPoint => [
    c * x + s * z + target.origin[0],
    -s * x + c * z + target.origin[2],
  ];
  return target.footprint.map((r) => ({
    outer: r.outer.map(convert),
    holes: r.holes?.map((h) => h.map(convert)),
  }));
}

export function localToWorld(target: MeasurementTarget, point: Vector3Tuple): Vector3Tuple {
  const [x, y, z] = point,
    c = Math.cos(target.rotation),
    s = Math.sin(target.rotation);
  return [
    c * x + s * z + target.origin[0],
    y + target.origin[1],
    -s * x + c * z + target.origin[2],
  ];
}

const edges = (rs: PlanRegion[]) =>
  rs.flatMap((r) =>
    rings(r).flatMap((q) => q.map((a, i) => [a, q[(i + 1) % q.length]] as [PlanPoint, PlanPoint])),
  );
interface DistanceResult {
  distance: number;
  a: PlanPoint;
  b: PlanPoint;
  status: 'separated' | 'touching' | 'overlapping';
}
function intersectionPoint(
  a: PlanPoint,
  b: PlanPoint,
  c: PlanPoint,
  d: PlanPoint,
): PlanPoint | null {
  if (!intersects(a, b, c, d)) return null;
  for (const p of [a, b]) if (onSegment(p, c, d)) return p;
  for (const p of [c, d]) if (onSegment(p, a, b)) return p;
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    ex = d[0] - c[0],
    ez = d[1] - c[1];
  const t = ((c[0] - a[0]) * ez - (c[1] - a[1]) * ex) / (dx * ez - dz * ex);
  return [a[0] + t * dx, a[1] + t * dz];
}
const segmentClosest = (a: PlanPoint, b: PlanPoint, c: PlanPoint, d: PlanPoint) => {
  const near = (p: PlanPoint, x: PlanPoint, y: PlanPoint) => {
    const dx = y[0] - x[0],
      dz = y[1] - x[1],
      den = dx * dx + dz * dz;
    const t = den ? Math.max(0, Math.min(1, ((p[0] - x[0]) * dx + (p[1] - x[1]) * dz) / den)) : 0;
    return [x[0] + t * dx, x[1] + t * dz] as PlanPoint;
  };
  const candidates: [PlanPoint, PlanPoint][] = [
    [a, near(a, c, d)],
    [b, near(b, c, d)],
    [near(c, a, b), c],
    [near(d, a, b), d],
  ];
  return candidates.reduce(
    (best, pair) =>
      dist2(pair[0], pair[1]) < best.distance ** 2
        ? { distance: Math.sqrt(dist2(pair[0], pair[1])), a: pair[0], b: pair[1] }
        : best,
    { distance: Infinity, a, b: c },
  );
};

export function regionsDistance(a: PlanRegion[], b: PlanRegion[]): DistanceResult | null {
  if (!a.length || !b.length) return null;
  const ae = edges(a),
    be = edges(b);
  let contact: PlanPoint | null = null;
  const zero = (point: PlanPoint, status: DistanceResult['status']): DistanceResult => ({
    distance: 0,
    a: point,
    b: point,
    status,
  });
  for (const [p, q] of ae)
    for (const [u, v] of be) {
      const hit = intersectionPoint(p, q, u, v);
      if (!hit) continue;
      if (properCross(p, q, u, v)) return zero(hit, 'overlapping');
      contact = hit;
    }
  for (const [first, second] of [
    [a, b],
    [b, a],
  ])
    for (const region of first!) {
      for (const point of region.outer)
        if (second!.some((r) => strictlyContains(point, r))) return zero(point, 'overlapping');
      // Edge midpoints cover collinear overlaps where all vertices lie on boundaries.
      for (const [p, q] of edges([region])) {
        const mid: PlanPoint = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        if (second!.some((r) => strictlyContains(mid, r))) return zero(mid, 'overlapping');
      }
    }
  if (contact) {
    // Coincident boundaries: sample locally on both sides of their common edge.
    for (const [p, q] of ae)
      for (const [u, v] of be) {
        if (Math.abs(cross(p, q, u)) > EPS || Math.abs(cross(p, q, v)) > EPS) continue;
        const overlap = [p, q, u, v].filter(
          (point) => onSegment(point, p, q) && onSegment(point, u, v),
        );
        if (overlap.length < 2) continue;
        overlap.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const l = overlap[0]!,
          r = overlap[overlap.length - 1]!;
        const mid: PlanPoint = [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2];
        const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (!length) continue;
        for (const sign of [-1, 1]) {
          const sample: PlanPoint = [
            mid[0] - ((q[1] - p[1]) / length) * 1e-7 * sign,
            mid[1] + ((q[0] - p[0]) / length) * 1e-7 * sign,
          ];
          if (
            a.some((region) => strictlyContains(sample, region)) &&
            b.some((region) => strictlyContains(sample, region))
          )
            return zero(mid, 'overlapping');
        }
      }
    return zero(contact, 'touching');
  }
  let best = { distance: Infinity, a: a[0]!.outer[0]!, b: b[0]!.outer[0]! };
  for (const [p, q] of ae)
    for (const [u, v] of be) {
      const x = segmentClosest(p, q, u, v);
      if (x.distance < best.distance) best = x;
    }
  return { ...best, status: 'separated' as const };
}

export function isValidRegion(value: unknown): value is PlanRegion {
  if (!value || typeof value !== 'object' || !Array.isArray((value as PlanRegion).outer))
    return false;
  const r = value as PlanRegion;
  if (r.holes !== undefined && !Array.isArray(r.holes)) return false;
  if ((r.holes ?? []).some((h) => !Array.isArray(h))) return false;
  const holes = r.holes ?? [];
  const rs = [r.outer, ...holes];
  if (
    rs.some(
      (q) =>
        q.length < 3 ||
        q.some((p) => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)) ||
        q.some((p, i) => dist2(p, q[(i + 1) % q.length]!) <= EPS * EPS),
    )
  )
    return false;
  for (const q of rs)
    for (let i = 0; i < q.length; i++)
      for (let j = i + 1; j < q.length; j++)
        if (
          j !== i + 1 &&
          !(i === 0 && j === q.length - 1) &&
          intersects(q[i]!, q[(i + 1) % q.length]!, q[j]!, q[(j + 1) % q.length]!)
        )
          return false;
  if (Math.abs(signedArea(r.outer)) <= EPS) return false;
  for (const h of r.holes ?? []) {
    if (Math.abs(signedArea(h)) <= EPS || !pointInRing(h[0]!, r.outer, false)) return false;
    for (const e of edges([{ outer: h }]))
      for (const o of edges([{ outer: r.outer }]))
        if (intersects(e[0], e[1], o[0], o[1])) return false;
  }
  for (let i = 0; i < (r.holes ?? []).length; i++)
    for (let j = i + 1; j < (r.holes ?? []).length; j++)
      for (const e of edges([{ outer: holes[i]! }]))
        for (const o of edges([{ outer: holes[j]! }]))
          if (intersects(e[0], e[1], o[0], o[1])) return false;
  for (let i = 0; i < holes.length; i++)
    for (let j = 0; j < holes.length; j++)
      if (i !== j && pointInRing(holes[i]![0]!, holes[j]!, true)) return false;
  return true;
}
