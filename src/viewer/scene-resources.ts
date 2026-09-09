import * as THREE from 'three';
import type { ApartmentModel } from '../model/types.ts';

export const CUT_HEIGHT = 1.05;

const CLIPPED_GROUPS = new Set(['walls', 'windows', 'doors', 'furniture']);

export function isClipped(part: { group: string }, mode: 'cut' | 'full' | 'top') {
  return mode !== 'full' && CLIPPED_GROUPS.has(part.group);
}

export interface SceneResources {
  geometries: {
    box: THREE.BoxGeometry;
    cylinder: THREE.CylinderGeometry;
    sphere: THREE.SphereGeometry;
  };
  materials: Record<string, THREE.MeshStandardMaterial>;
  capMaterial: THREE.MeshStandardMaterial;
  clippingPlane: THREE.Plane;
  dispose(): void;
}

export function createSceneResources(model: ApartmentModel): SceneResources {
  const materials: Record<string, THREE.MeshStandardMaterial> = {};
  for (const [key, [name, color, opacity]] of Object.entries(model.materials)) {
    materials[key] = new THREE.MeshStandardMaterial({
      name,
      color,
      opacity,
      roughness: ['glass', 'mirror', 'black'].includes(key) ? 0.23 : 0.85,
      metalness: key === 'dark' ? 0.22 : 0,
      transparent: opacity < 1,
      depthWrite: opacity === 1,
      side: opacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
    });
  }
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 24),
    sphere: new THREE.SphereGeometry(0.5, 20, 12),
  };
  const capMaterial = new THREE.MeshStandardMaterial({ color: 0x9a958b, roughness: 1 });
  const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT_HEIGHT);
  let disposed = false;
  return {
    geometries,
    materials,
    capMaterial,
    clippingPlane,
    dispose() {
      if (disposed) return;
      disposed = true;
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      Object.values(materials).forEach((material) => material.dispose());
      capMaterial.dispose();
    },
  };
}
