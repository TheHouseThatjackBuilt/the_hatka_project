import { Component, StrictMode, useLayoutEffect, type ReactNode } from 'react';
import { createRoot, extend, useFrame, type RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { ApartmentScene } from './ApartmentScene.tsx';
import { createCameraController, type CameraController } from './camera.ts';
import { bindCanvasControls } from './controls.ts';
import { createRoomLabels } from './labels.ts';
import type { ApartmentModel } from '../model/types.ts';
import type { ApartmentMesh, FitRect, ViewerHandle, ViewerOptions, ViewMode } from './types.ts';
import { createMeasurements } from './measurements.ts';
import { createResizeFit } from './resize-fit.ts';
import type { MeasurementSnapshot } from './measurement-types.ts';

extend({
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  HemisphereLight: THREE.HemisphereLight,
  DirectionalLight: THREE.DirectionalLight,
});

class SceneBoundary extends Component<
  { children: ReactNode; onError(error: unknown): void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function ViewerFrame({
  camera,
  labels,
  viewport,
  options,
  controls,
  measurements,
  onReady,
  onError,
}: {
  camera: CameraController;
  labels: ReturnType<typeof createRoomLabels>;
  viewport: HTMLElement;
  options: ViewerOptions;
  controls: ReturnType<typeof bindCanvasControls>;
  measurements: ReturnType<typeof createMeasurements>;
  onReady(): void;
  onError(error: unknown): void;
}) {
  useLayoutEffect(() => {
    camera.setMode(options.mode, true);
  }, [camera, options.mode]);
  useLayoutEffect(() => {
    controls.setPanMode(options.panMode);
  }, [controls, options.panMode]);
  useFrame(() => {
    if (!viewport.clientWidth || !viewport.clientHeight) return;
    try {
      camera.advance();
      camera.update();
      measurements.update(camera.camera, viewport.clientWidth, viewport.clientHeight);
      labels.update(
        camera.camera,
        viewport.clientWidth,
        viewport.clientHeight,
        options.mode,
        options.labelsVisible,
      );
      onReady();
    } catch (error) {
      onError(error);
    }
  });
  return null;
}

// A separate canvas per mount isolates Fiber's deferred root cleanup from the next mount.
// configure() is awaited here so WebGL failures reach the existing loading/error UI.
export function createViewer(
  viewport: HTMLElement,
  labelLayer: HTMLElement,
  model: ApartmentModel,
  initialOptions: ViewerOptions,
  onError: (error: unknown) => void,
  onMeasurement: (snapshot: MeasurementSnapshot) => void = () => {},
  getFitRect?: () => FitRect | undefined,
  onModeChange: (mode: ViewMode) => void = () => {},
): ViewerHandle {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.localClippingEnabled = true;
  renderer.toneMappingExposure = 1;
  const root = createRoot(canvas);
  const meshes: ApartmentMesh[] = [];
  const caps: THREE.Mesh[] = [];
  let state: RootState | undefined;
  let disposed = false;
  let options = { ...initialOptions };
  let resolveReady!: () => void;
  let rejectReady!: (error: unknown) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const invalidate = () => {
    if (!disposed) state?.invalidate();
  };
  const camera = createCameraController(viewport, meshes, invalidate, getFitRect);
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion = () => camera.setReducedMotion(motionPreference.matches);
  syncMotion();
  const resizeFit = createResizeFit(
    () => {
      if (!disposed) camera.fit();
    },
    () => viewport.clientWidth > 0 && viewport.clientHeight > 0,
  );
  Object.assign(camera.camera, { manual: true });
  let labels: ReturnType<typeof createRoomLabels>;
  let controls: ReturnType<typeof bindCanvasControls>;
  let observer: ResizeObserver;
  let measurements: ReturnType<typeof createMeasurements>;
  try {
    labels = createRoomLabels(labelLayer, model.labels, invalidate);
    measurements = createMeasurements(
      viewport,
      canvas,
      model,
      meshes,
      caps,
      options,
      invalidate,
      onMeasurement,
    );
    controls = bindCanvasControls(canvas, camera, measurements.interaction);
    observer = new ResizeObserver(resize);
    viewport.append(canvas);
    window.addEventListener('resize', onWindowResize);
    motionPreference.addEventListener('change', syncMotion);
    canvas.addEventListener('pointerdown', cancelResizeFit);
    canvas.addEventListener('wheel', cancelResizeFit, { passive: true });
  } catch (error) {
    motionPreference.removeEventListener('change', syncMotion);
    window.removeEventListener('resize', onWindowResize);
    camera.stop();
    observer!?.disconnect();
    controls!?.dispose();
    labels!?.dispose();
    measurements!?.dispose();
    root.unmount();
    renderer.dispose();
    canvas.remove();
    throw error;
  }

  function resize() {
    if (disposed || !state) return;
    if (!viewport.clientWidth || !viewport.clientHeight) return;
    state.setDpr(Math.min(window.devicePixelRatio, 2));
    state.setSize(viewport.clientWidth, viewport.clientHeight);
    invalidate();
    if (resizeFit.pending) resizeFit.schedule();
  }
  function onWindowResize() {
    if (disposed) return;
    resize();
    resizeFit.schedule();
  }
  function cancelResizeFit() {
    resizeFit.cancel();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    resizeFit.dispose();
    camera.stop();
    motionPreference.removeEventListener('change', syncMotion);
    window.removeEventListener('resize', onWindowResize);
    canvas.removeEventListener('pointerdown', cancelResizeFit);
    canvas.removeEventListener('wheel', cancelResizeFit);
    observer.disconnect();
    controls.dispose();
    labels.dispose();
    measurements.dispose();
    root.unmount();
    renderer.dispose();
    canvas.remove();
    rejectReady(new DOMException('Viewer disposed', 'AbortError'));
  }
  function fail(error: unknown) {
    if (disposed) return;
    rejectReady(error);
    onError(error);
    // Avoid unmounting the reconciler inside its own commit or frame callback.
    queueMicrotask(dispose);
  }
  function renderScene() {
    if (disposed || !state) return;
    root.render(
      <StrictMode>
        <SceneBoundary onError={fail}>
          <ApartmentScene model={model} options={options} meshes={meshes} caps={caps}>
            <ViewerFrame
              camera={camera}
              labels={labels}
              viewport={viewport}
              options={options}
              controls={controls}
              measurements={measurements}
              onReady={resolveReady}
              onError={fail}
            />
          </ApartmentScene>
        </SceneBoundary>
      </StrictMode>,
    );
    invalidate();
  }
  function preset(mode: ViewMode) {
    if (disposed) return;
    resizeFit.cancel();
    if (mode === options.mode) camera.reset(true);
    else {
      options = { ...options, mode };
      measurements.setOptions(options);
      renderScene();
      onModeChange(mode);
    }
  }
  void root
    .configure({
      gl: renderer,
      camera: camera.camera,
      frameloop: 'demand',
      shadows: 'soft',
      dpr: Math.min(window.devicePixelRatio, 2),
      size: { width: viewport.clientWidth, height: viewport.clientHeight, top: 0, left: 0 },
      onCreated: (created) => {
        state = created;
        resize();
      },
    })
    .then(() => {
      if (disposed) return;
      // render() returns the root store before the first React commit.
      state = root.render(null).getState();
      observer.observe(viewport);
      renderScene();
    })
    .catch(fail);

  return {
    ready,
    setOptions(next) {
      if (next.mode !== options.mode) resizeFit.cancel();
      options = { ...next };
      measurements.setOptions(options);
      renderScene();
    },
    rotate(angle) {
      resizeFit.cancel();
      if (!disposed) camera.rotate(angle);
    },
    zoom(factor) {
      resizeFit.cancel();
      if (!disposed) camera.zoomAt(factor);
    },
    fit() {
      resizeFit.cancel();
      if (!disposed) camera.fit(true);
    },
    reset() {
      preset('cut');
    },
    top() {
      preset('top');
    },
    measurement(command) {
      if (!disposed) measurements.command(command);
    },
    dispose,
  };
}
