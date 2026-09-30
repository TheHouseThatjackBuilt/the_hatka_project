import type { BufferGeometry, Mesh, MeshStandardMaterial } from 'three';
import type { ModelPart } from '../model/types.ts';
import type { MeasurementCommand, MeasurementTool } from './measurement-types.ts';
import type { PerformanceProfile } from './performance.ts';
import type { FloorSelection } from './flooring-options.ts';

export type ViewMode = 'cut' | 'full' | 'top';
export type ViewerStatus = 'loading' | 'ready' | 'error';

export interface ViewerOptions {
  cutHeight: number;
  performanceProfile: PerformanceProfile;
  mode: ViewMode;
  furnitureVisible: boolean;
  labelsVisible: boolean;
  panMode: boolean;
  measurementTool: MeasurementTool;
  flooring?: FloorSelection;
}

export interface ViewerHandle {
  ready: Promise<void>;
  setOptions(options: ViewerOptions): void;
  rotate(angle: number): void;
  zoom(factor: number): void;
  fit(): void;
  reset(): void;
  top(): void;
  measurement(command: MeasurementCommand): void;
  dispose(): void;
}

export type ApartmentMesh = Mesh<BufferGeometry, MeshStandardMaterial> & { userData: ModelPart };

export interface Viewport {
  clientWidth: number;
  clientHeight: number;
  getBoundingClientRect(): Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
}

/** CSS pixels relative to the canvas; only used when fitting the camera. */
export type FitRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
