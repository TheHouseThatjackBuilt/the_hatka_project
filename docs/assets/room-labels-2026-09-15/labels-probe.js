// Development-only acceptance probe; not imported by the production entry point.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { _roots } from '@react-three/fiber';
import { App } from '../../../src/App.tsx';
import { floorPixelScale } from '../../../src/viewer/label-projection.ts';
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
  'position:fixed;right:70px;bottom:45px;z-index:100;background:#22262b;color:white;padding:8px;max-width:400px;font:11px monospace';
const output = document.createElement('pre');
output.id = 'labels-result';
output.style.cssText = 'max-height:120px;overflow:auto';
function capture() {
  const canvas = document.querySelector('canvas');
  const state = _roots.get(canvas)?.store.getState();
  return {
    canvases: document.querySelectorAll('canvas').length,
    roots: _roots.size,
    labels: document.querySelectorAll('.room-label').length,
    leaderLayers: document.querySelectorAll('.room-label-leaders').length,
    leaders: document.querySelectorAll('.room-label-leaders line').length,
    measurements: document.querySelectorAll('.ap-measurements').length,
    frame: state?.gl.info.render.frame,
    scale: state ? floorPixelScale(state.camera, innerWidth, innerHeight) : null,
    position: state?.camera.position.toArray(),
    quaternion: state?.camera.quaternion.toArray(),
    names: Array.from(document.querySelectorAll('.room-label')).map((e) => ({
      text: e.textContent,
      opacity: getComputedStyle(e).opacity,
      rect: e.getBoundingClientRect().toJSON(),
    })),
  };
}
function button(text, action) {
  const element = document.createElement('button');
  element.textContent = text;
  element.onclick = action;
  panel.append(element);
}
button('Замер подписей', () => {
  output.textContent = JSON.stringify(capture());
});
button('Покой 1 с', async () => {
  const before = capture();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const after = capture();
  output.textContent = JSON.stringify({ before, after, idleFrames: after.frame - before.frame });
});
button('Убрать / вернуть viewer', () => {
  mounted = !mounted;
  render();
});
panel.append(output);
document.body.append(panel);
