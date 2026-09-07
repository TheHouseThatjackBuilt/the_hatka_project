import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, WebGLRenderer } from 'three';
import { createApartmentScene } from './scene.ts';
import { createCameraController } from './camera.ts';
import { bindCanvasControls } from './controls.ts';
import { createRoomLabels } from './labels.ts';
import type { ApartmentModel } from '../model/types.ts';
import type { ViewerHandle, ViewerOptions } from './types.ts';

export function createViewer(
  viewport: HTMLElement,
  labelLayer: HTMLElement,
  model: ApartmentModel,
  initialOptions: ViewerOptions,
): ViewerHandle {
  const cleanups: (() => void)[] = [];
  let frameId: number | null = null;
  let disposed = false;
  let options = { ...initialOptions };

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    for (const cleanup of cleanups.reverse()) cleanup();
  }

  try {
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    cleanups.push(() => renderer.dispose());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    viewport.append(renderer.domElement);
    cleanups.push(() => renderer.domElement.remove());

    const apartment = createApartmentScene(model);
    cleanups.push(apartment.dispose);
    const labels = createRoomLabels(labelLayer, model.labels);
    cleanups.push(labels.dispose);
    const camera = createCameraController(viewport, apartment.meshes, requestRender);
    const controls = bindCanvasControls(renderer.domElement, camera);
    cleanups.push(controls.dispose);

    function render() {
      frameId = null;
      if (disposed || !viewport.clientWidth || !viewport.clientHeight) return;
      camera.update();
      renderer.render(apartment.scene, camera.camera);
      labels.update(
        camera.camera,
        viewport.clientWidth,
        viewport.clientHeight,
        options.mode,
        options.labelsVisible,
      );
    }

    // The apartment is static: avoid a continuous animation loop.
    function requestRender() {
      if (!disposed && frameId === null) frameId = requestAnimationFrame(render);
    }

    function setOptions(next: ViewerOptions) {
      if (disposed) return;
      const modeChanged = next.mode !== options.mode;
      options = { ...next };
      apartment.setFurnitureVisible(options.furnitureVisible);
      controls.setPanMode(options.panMode);
      if (modeChanged) {
        apartment.setMode(options.mode);
        camera.setMode(options.mode);
      }
      requestRender();
    }

    function resize() {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
      requestRender();
    }
    const observer = new ResizeObserver(resize);
    cleanups.push(() => observer.disconnect());
    observer.observe(viewport);
    apartment.setFurnitureVisible(options.furnitureVisible);
    apartment.setMode(options.mode);
    camera.setMode(options.mode);
    controls.setPanMode(options.panMode);
    resize();

    return { setOptions, rotate: camera.rotate, zoom: camera.zoomAt, fit: camera.fit, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
