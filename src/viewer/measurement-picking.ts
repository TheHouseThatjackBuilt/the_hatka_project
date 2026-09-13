import { Raycaster, Vector2, type Camera, type Mesh, type Object3D } from 'three';
import type { ModelPart } from '../model/types.ts';
import { CUT_HEIGHT, isClipped } from './scene-resources.ts';
import type { ViewMode } from './types.ts';

export interface PickSurface {
  mesh: Mesh;
  part: ModelPart;
  cutCap?: boolean;
}

export function isWorldVisible(object: Object3D): boolean {
  for (let node: Object3D | null = object; node; node = node.parent) {
    if (!node.visible) return false;
  }
  return true;
}

/** Material clipping and Object3D.visible are not applied by three's Raycaster. */
export function pickMeasurementSurface(
  camera: Camera,
  pointer: Vector2,
  surfaces: PickSurface[],
  mode: ViewMode,
  raycaster = new Raycaster(),
) {
  const candidates = surfaces.filter(
    ({ mesh, part, cutCap }) =>
      isWorldVisible(mesh) && part.group !== 'ceiling' && (!cutCap || mode !== 'full'),
  );
  const byMesh = new Map(candidates.map((surface) => [surface.mesh, surface]));
  for (const { mesh } of candidates) mesh.updateWorldMatrix(true, false);
  raycaster.setFromCamera(pointer, camera);
  for (const hit of raycaster.intersectObjects(
    candidates.map(({ mesh }) => mesh),
    false,
  )) {
    const surface = byMesh.get(hit.object as Mesh)!;
    if (!surface.cutCap && isClipped(surface.part, mode) && hit.point.y > CUT_HEIGHT + 1e-7)
      continue;
    const point = hit.point.clone();
    if (surface.cutCap) point.y = CUT_HEIGHT;
    return { ...surface, point };
  }
  return null;
}
