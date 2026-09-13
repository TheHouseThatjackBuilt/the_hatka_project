import type { BufferGeometry, Mesh, MeshStandardMaterial } from 'three';
import type { ModelPart } from '../model/types.ts';
import type { MeasurementCommand, MeasurementTool } from './measurement-types.ts';

export type ViewMode = 'cut' | 'full' | 'top';
export type ViewerStatus = 'loading' | 'ready' | 'error';

export interface ViewerOptions {
  mode: ViewMode;
  furnitureVisible: boolean;
  labelsVisible: boolean;
  panMode: boolean;
  measurementTool: MeasurementTool;
}

export interface ViewerHandle {
  ready: Promise<void>;
  setOptions(options: ViewerOptions): void;
  rotate(angle: number): void;
  zoom(factor: number): void;
  fit(): void;
  measurement(command: MeasurementCommand): void;
  dispose(): void;
}

export type ApartmentMesh = Mesh<BufferGeometry, MeshStandardMaterial> & { userData: ModelPart };

export interface Viewport {
  clientWidth: number;
  clientHeight: number;
  getBoundingClientRect(): Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
}
