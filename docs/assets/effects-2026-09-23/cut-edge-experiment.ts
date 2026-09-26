import { addEffect, type RootState } from '@react-three/fiber';
import * as THREE from 'three';
import type { ModelPart } from '../../../src/model/types.ts';
import { CUT_HEIGHT } from '../../../src/viewer/scene-resources.ts';

/** One line batch around actual wall caps, without per-object EdgesGeometry. */
export function cutEdgePositions(parts: ModelPart[]): Float32Array {
  const points: number[] = [];
  for (const part of parts) {
    if (
      part.group !== 'walls' ||
      part.shape !== 'box' ||
      part.pos[1] - part.size[1] / 2 >= CUT_HEIGHT ||
      part.pos[1] + part.size[1] / 2 <= CUT_HEIGHT
    )
      continue;
    const c = Math.cos(part.rot),
      s = Math.sin(part.rot);
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([x, z]) => {
      const dx = (x! * part.size[0]) / 2,
        dz = (z! * part.size[2]) / 2;
      return [part.pos[0] + c * dx + s * dz, CUT_HEIGHT + 0.003, part.pos[2] - s * dx + c * dz];
    });
    for (let i = 0; i < 4; i++) points.push(...corners[i]!, ...corners[(i + 1) % 4]!);
  }
  return new Float32Array(points);
}

export function attachCutEdges(state: RootState) {
  const parts: ModelPart[] = [];
  state.scene.traverse((object) => {
    if (object.userData.shape) parts.push(object.userData as ModelPart);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(cutEdgePositions(parts), 3));
  const material = new THREE.LineBasicMaterial({
    color: '#514c43',
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    toneMapped: false,
  });
  const line = new THREE.LineSegments(geometry, material);
  line.name = 'cut-edges';
  line.renderOrder = 1;
  state.scene.add(line);
  const stop = addEffect(() => {
    line.visible = state.scene.getObjectByName('cutCaps')?.visible ?? false;
  });
  state.invalidate();
  return () => {
    stop();
    state.scene.remove(line);
    geometry.dispose();
    material.dispose();
    state.invalidate();
  };
}
