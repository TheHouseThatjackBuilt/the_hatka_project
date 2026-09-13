export type MeasurementTool = 'off' | 'objects' | 'rooms' | 'distance' | 'points';

export interface MeasurementChoice {
  id: string;
  label: string;
}

export interface MeasurementResult {
  title: string;
  values: { label: string; value: string }[];
  note: string;
}

export interface MeasurementSnapshot {
  available: boolean;
  objects: MeasurementChoice[];
  rooms: MeasurementChoice[];
  selectedIds: string[];
  pinned: boolean;
  pointCount: number;
  result: MeasurementResult | null;
}

export type MeasurementCommand = { type: 'clear' } | { type: 'select'; id: string; slot?: 0 | 1 };

export const EMPTY_MEASUREMENT_SNAPSHOT: MeasurementSnapshot = {
  available: false,
  objects: [],
  rooms: [],
  selectedIds: [],
  pinned: false,
  pointCount: 0,
  result: null,
};
