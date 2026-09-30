import { FLOOR_COMPARISON_FORMATS } from '../model/flooring-presets.ts';
export { FLOOR_COMPARISON_FORMATS } from '../model/flooring-presets.ts';

export interface FloorSelection {
  formatId: string;
  direction: 'x' | 'z';
}

export const DEFAULT_FLOOR_SELECTION: FloorSelection = { formatId: '20x120', direction: 'z' };
export const FLOOR_SELECTION_STORAGE_KEY = 'hatka:floor-selection:v1';

export function isFloorSelection(value: unknown): value is FloorSelection {
  if (typeof value !== 'object' || value === null) return false;
  const selection = value as Partial<FloorSelection>;
  return (
    FLOOR_COMPARISON_FORMATS.some((format) => format.id === selection.formatId) &&
    (selection.direction === 'x' || selection.direction === 'z')
  );
}

export function readFloorSelection(storage: Pick<Storage, 'getItem'>): FloorSelection {
  try {
    const value: unknown = JSON.parse(storage.getItem(FLOOR_SELECTION_STORAGE_KEY) ?? 'null');
    if (isFloorSelection(value)) return { formatId: value.formatId, direction: value.direction };
  } catch {
    // A blocked or malformed store must not prevent loading the apartment.
  }
  return { ...DEFAULT_FLOOR_SELECTION };
}

export function writeFloorSelection(storage: Pick<Storage, 'setItem'>, selection: FloorSelection) {
  try {
    storage.setItem(FLOOR_SELECTION_STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // The active comparison remains usable when persistent storage is unavailable.
  }
}
