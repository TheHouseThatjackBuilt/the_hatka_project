/** Comparison formats, not a manufacturer's confirmed product sizes. Units are metres. */
export interface FloorTileFormat {
  id: string;
  width: number;
  length: number;
}

/** Unspecified fields await a layout decision; no construction defaults are inferred. */
export interface FloorLayout {
  formatId?: string;
  /** World axis along the tile's length. */
  direction?: 'x' | 'z';
  /** Offset between rows, as a fraction of tile length in [0, 1). */
  rowOffset?: number;
  /** Joint width in metres. */
  groutWidth?: number;
  groutColor?: string;
  origin?: [x: number, z: number];
}

export interface FloorCovering {
  id: string;
  label: string;
  kind: 'porcelain-stoneware';
  appearance: 'wood-effect';
  source: string;
  formats: FloorTileFormat[];
  layout: FloorLayout;
  product?: {
    manufacturer?: string;
    collection?: string;
    article?: string;
    url?: string;
  };
}

/** A finish and its joints may span rooms; slabs and thresholds are separate. */
export interface FloorSurface {
  id: string;
  label: string;
  coveringId: string | null;
  source: string;
}

/** Draft finish assignments; viewer comparisons may override the original ModelPart.mat. */
export interface ModelFlooring {
  version: 1;
  status: 'draft';
  coverings: FloorCovering[];
  surfaces: FloorSurface[];
}
