import { Vector3, type Camera } from 'three';

// Project a unit square on the floor. This measures screen scale, not room area.
// Unlike camera distance it responds to orthographic zoom and foreshortening.
export function floorPixelScale(camera: Camera, width: number, height: number): number {
  const origin = new Vector3(0, 0.06, 0).project(camera);
  const x = new Vector3(1, 0.06, 0).project(camera).sub(origin);
  const z = new Vector3(0, 0.06, 1).project(camera).sub(origin);
  const area = Math.abs(((x.x * z.y - x.y * z.x) * width * height) / 4);
  return Number.isFinite(area) ? Math.sqrt(area) : 0;
}
