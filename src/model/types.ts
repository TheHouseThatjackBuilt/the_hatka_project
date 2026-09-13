import type { ModelMeasurements } from './measurement-types.ts';

export type Vector3Tuple = [number, number, number];
export type ModelShape = 'box' | 'cylinder' | 'sphere';
export type ModelGroup =
  'floor' | 'walls' | 'windows' | 'doors' | 'furniture' | 'balcony' | 'ceiling';
export type ModelMaterial = [name: string, color: string, opacity: number];
export type RoomLabel = [name: string, x: number, z: number];

export interface ModelPart {
  name: string;
  shape: ModelShape;
  pos: Vector3Tuple;
  size: Vector3Tuple;
  mat: string;
  group: ModelGroup;
  rot: number;
  measurementId?: string;
}

export interface ApartmentModel {
  metadata: {
    title: string;
    units: 'metres';
    ceilingHeight: number;
    coordinateSystem: string;
    source: string;
    status: string;
  };
  materials: Record<string, ModelMaterial>;
  parts: ModelPart[];
  labels: RoomLabel[];
  measurements?: ModelMeasurements;
}
