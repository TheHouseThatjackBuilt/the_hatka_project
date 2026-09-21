// Development-only browser diagnostic. Not imported by the production entry point.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { _roots } from '@react-three/fiber';
import { Vector3 } from 'three';
import { App } from '../../../src/App.tsx';
import '../../../src/styles.css';

const root = createRoot(document.getElementById('root'));
let mounted = true;
const render = () =>
  root.render(
    mounted ? React.createElement(React.StrictMode, null, React.createElement(App)) : null,
  );
render();
const panel = document.createElement('aside');
panel.style.cssText =
  'position:fixed;right:8px;top:8px;z-index:100;background:#20252a;color:white;padding:4px;max-width:360px;font:11px monospace';
const output = document.createElement('pre');
output.id = 'fit-result';
output.style.cssText = 'max-height:140px;overflow:auto;margin:0';
function button(label, action) {
  const button = document.createElement('button');
  button.textContent = label;
  button.style.cssText = 'min-height:24px;padding:3px;font:11px sans-serif';
  button.onclick = action;
  panel.append(button);
}
function capture() {
  const canvas = document.querySelector('canvas');
  const state = _roots.get(canvas)?.store.getState();
  const viewport = document.querySelector('.ap-canvas-container');
  if (!state) return { canvases: document.querySelectorAll('canvas').length, roots: _roots.size };
  const { camera, scene, gl } = state;
  const mode = document.querySelector('#ap-view').value;
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  scene.traverseVisible((mesh) => {
    if (!mesh.isMesh || !mesh.userData.size) return;
    mesh.updateWorldMatrix(true, false);
    for (const x of [-0.5, 0.5])
      for (const y of [-0.5, 0.5])
        for (const z of [-0.5, 0.5]) {
          const point = new Vector3(x, y, z).applyMatrix4(mesh.matrixWorld);
          const plane = mesh.material.clippingPlanes?.[0];
          if (plane) point.y = Math.min(point.y, plane.constant);
          point.project(camera);
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        }
  });
  const aspect = viewport.clientWidth / viewport.clientHeight;
  const baseSpan = Math.max(
    mode === 'full' ? 11.1 : 10.4,
    (mode === 'full' ? 13.5 : 13.2) / aspect,
  );
  return {
    window: [innerWidth, innerHeight],
    viewport: [viewport.clientWidth, viewport.clientHeight],
    mode,
    measurements: !!document.querySelector('.measurement-panel'),
    bounds: [minX, maxX, minY, maxY],
    fill: Math.max(maxX - minX, maxY - minY) / 2,
    zoom: baseSpan / (camera.top - camera.bottom),
    position: camera.position.toArray(),
    quaternion: camera.quaternion.toArray(),
    finite: camera.projectionMatrix.elements.every(Number.isFinite),
    frame: gl.info.render.frame,
    canvases: document.querySelectorAll('canvas').length,
    roots: _roots.size,
  };
}
button('Замер камеры', () => {
  output.textContent = JSON.stringify(capture(), null, 2);
});
button('Покой 1 с', async () => {
  const before = capture();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const after = capture();
  output.textContent = JSON.stringify(
    { before, after, idleFrames: after.frame - before.frame },
    null,
    2,
  );
});
button('Убрать / вернуть viewer', () => {
  mounted = !mounted;
  render();
});
button('Нулевой размер / вернуть', () => {
  const viewport = document.querySelector('.ap-canvas-container');
  if (!viewport) return;
  viewport.style.width = viewport.style.width ? '' : '0px';
  viewport.style.height = viewport.style.height ? '' : '0px';
});
panel.append(output);
document.body.append(panel);
