import type { Vector3Tuple } from './types.ts';

export type PlanPoint = [x: number, z: number];

/** Filled region. Rings do not repeat the first vertex; holes exclude their interior. */
export interface PlanRegion {
  outer: PlanPoint[];
  holes?: PlanPoint[][];
}

export interface MeasurementTarget {
  id: string;
  label: string;
  kind: 'object' | 'wall' | 'opening';
  /** Centre in world coordinates; size and footprint use this target's local axes. */
  origin: Vector3Tuple;
  rotation: number;
  size: Vector3Tuple;
  footprint: PlanRegion[];
  planSource: string;
  heightSource: string;
  diameter?: number;
}

export interface MeasurementRoom {
  id: string;
  label: string;
  /** World X/Z coordinates along the agreed interior boundary. */
  region: PlanRegion;
  height: number;
  source: string;
  heightSource: string;
}

export interface ModelMeasurements {
  version: 1;
  targets: MeasurementTarget[];
  rooms: MeasurementRoom[];
}
