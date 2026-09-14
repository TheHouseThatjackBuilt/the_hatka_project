import { OrthographicCamera, Vector3 } from 'three';
import { CUT_HEIGHT, isClipped } from './scene-resources.ts';
import type { ApartmentMesh, ViewMode, Viewport } from './types.ts';

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 6;
const FIT_FILL = 0.88;
const clampZoom = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));

export function createCameraController(
  area: Viewport,
  meshes: ApartmentMesh[],
  requestRender: () => void,
) {
  const camera = new OrthographicCamera(-8, 8, 6, -6, 0.1, 100);
  const target = new Vector3();
  const panOffset = new Vector3();
  const cameraRight = new Vector3();
  const cameraUp = new Vector3();
  let angle = -0.2;
  let elevation = 1.04;
  let zoom = 1;
  let mode: ViewMode = 'cut';
  let pendingFit = false;
  const hasSize = () => area.clientWidth > 0 && area.clientHeight > 0;

  function update() {
    if (!hasSize()) return;
    if (pendingFit) {
      fit();
      return;
    }
    const aspect = area.clientWidth / Math.max(1, area.clientHeight);
    const span =
      Math.max(mode === 'full' ? 11.1 : 10.4, (mode === 'full' ? 13.5 : 13.2) / aspect) / zoom;
    camera.left = (-span * aspect) / 2;
    camera.right = (span * aspect) / 2;
    camera.top = span / 2;
    camera.bottom = -span / 2;
    target.set(5.12, mode === 'full' ? 1 : 0.35, 3.92).add(panOffset);
    camera.position.set(
      target.x + 18 * Math.cos(elevation) * Math.sin(angle),
      target.y + 18 * Math.sin(elevation),
      target.z + 18 * Math.cos(elevation) * Math.cos(angle),
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function panPixels(dx: number, dy: number) {
    if (!hasSize()) return;
    update();
    const units = (camera.top - camera.bottom) / Math.max(1, area.clientHeight);
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
    panOffset.addScaledVector(cameraRight, -dx * units).addScaledVector(cameraUp, dy * units);
    requestRender();
  }

  function zoomAt(factor: number, clientX?: number, clientY?: number) {
    if (!hasSize() || !Number.isFinite(factor) || factor <= 0) return;
    const nextZoom = clampZoom(zoom * factor);
    if (clientX !== undefined && clientY !== undefined) {
      const rect = area.getBoundingClientRect();
      const dx = clientX - rect.left - rect.width / 2;
      const dy = clientY - rect.top - rect.height / 2;
      // Offset using the current scale so the point under the cursor stays fixed.
      panPixels(-dx * (1 - zoom / nextZoom), -dy * (1 - zoom / nextZoom));
    }
    zoom = nextZoom;
    requestRender();
  }

  function fit() {
    if (!hasSize()) {
      pendingFit = true;
      return;
    }
    pendingFit = false;
    update();
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    const corner = new Vector3();
    for (const mesh of meshes) {
      if (!mesh.visible || !mesh.parent?.visible) continue;
      const part = mesh.userData;
      const bottom = part.pos[1] - part.size[1] / 2;
      const top = isClipped(part, mode)
        ? Math.min(CUT_HEIGHT, part.pos[1] + part.size[1] / 2)
        : part.pos[1] + part.size[1] / 2;
      if (top < bottom) continue;
      const cosine = Math.cos(part.rot),
        sine = Math.sin(part.rot);
      for (const x of [-part.size[0] / 2, part.size[0] / 2]) {
        for (const y of [bottom, top]) {
          for (const z of [-part.size[2] / 2, part.size[2] / 2]) {
            corner
              .set(part.pos[0] + cosine * x + sine * z, y, part.pos[2] - sine * x + cosine * z)
              .project(camera);
            minX = Math.min(minX, corner.x);
            maxX = Math.max(maxX, corner.x);
            minY = Math.min(minY, corner.y);
            maxY = Math.max(maxY, corner.y);
          }
        }
      }
    }
    if (!Number.isFinite(minX)) return;
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
    panOffset
      .addScaledVector(cameraRight, ((minX + maxX) * (camera.right - camera.left)) / 4)
      .addScaledVector(cameraUp, ((minY + maxY) * (camera.top - camera.bottom)) / 4);
    zoom = clampZoom((zoom * FIT_FILL) / Math.max((maxX - minX) / 2, (maxY - minY) / 2));
    update();
    requestRender();
  }

  function setMode(value: ViewMode) {
    mode = value;
    angle = mode === 'top' ? 0 : -0.2;
    elevation = mode === 'top' ? Math.PI / 2 - 0.0001 : mode === 'full' ? 0.91 : 1.04;
    fit();
  }

  function rotate(deltaAngle: number, deltaElevation = 0) {
    angle += deltaAngle;
    if (mode !== 'top') elevation = Math.max(0.3, Math.min(1.49, elevation + deltaElevation));
    requestRender();
  }

  return { camera, update, panPixels, zoomAt, fit, setMode, rotate };
}

export type CameraController = ReturnType<typeof createCameraController>;
