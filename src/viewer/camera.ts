import { OrthographicCamera, Vector3 } from 'three';
import { CUT_HEIGHT, isClipped } from './scene-resources.ts';
import type { ApartmentMesh, FitRect, ViewMode, Viewport } from './types.ts';

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 6;
const FIT_FILL = 0.88;
const clampZoom = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));

export function createCameraController(
  area: Viewport,
  meshes: ApartmentMesh[],
  requestRender: () => void,
  getFitRect: () => FitRect | undefined = () => undefined,
  now: () => number = () => performance.now(),
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
  let initialized = false;
  let reducedMotion = false;
  type Pose = { angle: number; elevation: number; zoom: number; pan: Vector3 };
  let transition: { from: Pose; to: Pose; start: number } | null = null;
  let gesture: { kind: 'rotate' | 'pan'; x: number; y: number; time: number } | null = null;
  const pose = (): Pose => ({ angle, elevation, zoom, pan: panOffset.clone() });
  function apply(value: Pose) {
    angle = value.angle;
    elevation = value.elevation;
    zoom = value.zoom;
    panOffset.copy(value.pan);
  }
  function stop() {
    transition = null;
    gesture = null;
  }
  function animate(from: Pose, enabled: boolean) {
    if (!enabled || reducedMotion || !hasSize()) return;
    const to = pose();
    // Take the shortest path even after several complete manual revolutions.
    from.angle =
      to.angle - Math.atan2(Math.sin(to.angle - from.angle), Math.cos(to.angle - from.angle));
    transition = { from, to, start: now() };
    apply(from);
    update();
    requestRender();
  }
  function queueGesture(kind: 'rotate' | 'pan', x: number, y: number) {
    transition = null;
    if (gesture?.kind !== kind) gesture = { kind, x: 0, y: 0, time: now() };
    gesture.x += x;
    gesture.y += y;
    requestRender();
  }
  function advance() {
    if (!hasSize()) return;
    if (transition) {
      const { from, to, start } = transition;
      const t = Math.min(1, Math.max(0, (now() - start) / 450));
      const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
      angle = from.angle + (to.angle - from.angle) * eased;
      elevation = from.elevation + (to.elevation - from.elevation) * eased;
      zoom = from.zoom + (to.zoom - from.zoom) * eased;
      panOffset.lerpVectors(from.pan, to.pan, eased);
      if (t === 1) transition = null;
      else requestRender();
    }
    if (gesture) {
      // Consume the remaining drag with a short, frame-rate independent tail.
      // Wheel and pinch stay direct to preserve their screen-space anchor.
      const current = gesture;
      const elapsed = Math.max(0, now() - current.time);
      const fraction = 1 - Math.exp(-elapsed / 45);
      const done =
        Math.max(Math.abs(current.x), Math.abs(current.y)) <
        (current.kind === 'pan' ? 0.05 : 0.0001);
      const x = current.x * (done ? 1 : fraction),
        y = current.y * (done ? 1 : fraction);
      current.x -= x;
      current.y -= y;
      current.time = now();
      if (current.kind === 'pan') movePan(x, y);
      else moveRotate(x, y);
      if (done) gesture = null;
      else requestRender();
    }
  }
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

  function movePan(dx: number, dy: number) {
    if (!hasSize()) return;
    update();
    const units = (camera.top - camera.bottom) / Math.max(1, area.clientHeight);
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
    panOffset.addScaledVector(cameraRight, -dx * units).addScaledVector(cameraUp, dy * units);
  }

  function panPixels(dx: number, dy: number, smooth = false) {
    if (!hasSize()) return;
    if (smooth && !reducedMotion) return queueGesture('pan', dx, dy);
    stop();
    movePan(dx, dy);
    requestRender();
  }

  function zoomAt(factor: number, clientX?: number, clientY?: number) {
    if (!hasSize() || !Number.isFinite(factor) || factor <= 0) return;
    stop();
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

  function fit(animated = false) {
    stop();
    const from = pose();
    if (!hasSize()) {
      pendingFit = true;
      return;
    }
    pendingFit = false;
    update();
    const requested = getFitRect();
    const width = area.clientWidth,
      height = area.clientHeight;
    let rect: FitRect = { left: 0, top: 0, width, height };
    if (requested && Object.values(requested).every(Number.isFinite)) {
      const left = Math.max(0, requested.left),
        top = Math.max(0, requested.top);
      const right = Math.min(width, requested.left + requested.width);
      const bottom = Math.min(height, requested.top + requested.height);
      if (right > left && bottom > top)
        rect = { left, top, width: right - left, height: bottom - top };
    }
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
    zoom = clampZoom(
      (zoom * FIT_FILL) /
        Math.max(
          (((maxX - minX) / 2) * width) / rect.width,
          (((maxY - minY) / 2) * height) / rect.height,
        ),
    );
    // Center first, then offset with the final scale: an asymmetric fit area
    // must keep the same screen center even when fit changes zoom.
    update();
    const centerX = (2 * (rect.left + rect.width / 2)) / width - 1;
    const centerY = 1 - (2 * (rect.top + rect.height / 2)) / height;
    panOffset
      .addScaledVector(cameraRight, (-centerX * (camera.right - camera.left)) / 2)
      .addScaledVector(cameraUp, (-centerY * (camera.top - camera.bottom)) / 2);
    update();
    animate(from, animated);
    requestRender();
  }

  function setMode(value: ViewMode, animated = false) {
    if (initialized && value === mode) return;
    stop();
    const aspect = area.clientWidth / Math.max(1, area.clientHeight);
    const baseSpan = (value: ViewMode) =>
      Math.max(
        value === 'full' ? 11.1 : 10.4,
        (value === 'full' ? 13.5 : 13.2) / Math.max(aspect, 0.0001),
      );
    // Express the displayed pose in the new mode's scale and target basis
    // before fitting its destination, so changing full/cut cannot jump.
    zoom *= baseSpan(value) / baseSpan(mode);
    panOffset.y += (mode === 'full' ? 1 : 0.35) - (value === 'full' ? 1 : 0.35);
    const from = pose();
    mode = value;
    angle = mode === 'top' ? 0 : -0.2;
    elevation = mode === 'top' ? Math.PI / 2 - 0.0001 : mode === 'full' ? 0.91 : 1.04;
    panOffset.set(0, 0, 0);
    fit();
    animate(from, initialized && animated);
    initialized = true;
  }

  function reset(animated = false) {
    stop();
    const from = pose();
    angle = mode === 'top' ? 0 : -0.2;
    elevation = mode === 'top' ? Math.PI / 2 - 0.0001 : mode === 'full' ? 0.91 : 1.04;
    panOffset.set(0, 0, 0);
    fit();
    animate(from, animated);
  }

  function moveRotate(deltaAngle: number, deltaElevation: number) {
    angle += deltaAngle;
    if (mode !== 'top') elevation = Math.max(0.3, Math.min(1.49, elevation + deltaElevation));
  }

  function rotate(deltaAngle: number, deltaElevation = 0, smooth = false) {
    if (smooth && !reducedMotion) return queueGesture('rotate', deltaAngle, deltaElevation);
    stop();
    moveRotate(deltaAngle, deltaElevation);
    requestRender();
  }

  function setReducedMotion(value: boolean) {
    reducedMotion = value;
    if (!value) return;
    if (transition) apply(transition.to);
    if (gesture?.kind === 'pan') movePan(gesture.x, gesture.y);
    else if (gesture) moveRotate(gesture.x, gesture.y);
    stop();
    requestRender();
  }

  return {
    camera,
    update,
    advance,
    stop,
    setReducedMotion,
    panPixels,
    zoomAt,
    fit,
    reset,
    setMode,
    rotate,
  };
}

export type CameraController = ReturnType<typeof createCameraController>;
