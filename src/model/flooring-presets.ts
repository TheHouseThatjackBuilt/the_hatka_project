import type { FloorTileFormat } from './flooring-types.ts';

/** User-requested comparison sizes, in metres. */
export const FLOOR_COMPARISON_FORMATS: readonly FloorTileFormat[] = [
  { id: '20x120', width: 0.2, length: 1.2 },
  { id: '20x60', width: 0.2, length: 0.6 },
];
