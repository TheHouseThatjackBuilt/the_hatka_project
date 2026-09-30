import React, { StrictMode, useCallback, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as fiber from '@react-three/fiber';
import { App } from '../../../src/App.tsx';
import '../../../src/styles.css';

type CameraLike = { matrixWorld: { elements: number[] }; projectionMatrix: { elements: number[] } };
type RootState = { gl: { info: { render: { frame: number } } }; camera: CameraLike };
type ProbeResult = Record<string, unknown>;

const roots = () =>
  (fiber as typeof fiber & { _roots?: Map<HTMLElement, { store: { getState(): RootState } }> })
    ._roots;
const snapshot = () => {
  const values = [...(roots()?.values() ?? [])];
  const states = values.map((entry) => entry.store.getState());
  return {
    roots: values.length,
    canvases: document.querySelectorAll('canvas').length,
    frames: states.map((state) => state.gl.info.render.frame),
    camera: (() => {
      const camera = states[0]?.camera;
      return camera
        ? {
            matrixWorld: [...camera.matrixWorld.elements],
            projection: [...camera.projectionMatrix.elements],
          }
        : undefined;
    })(),
  };
};
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const framesFor = async (ms: number) => {
  const values: unknown[] = [];
  const end = performance.now() + ms;
  while (performance.now() < end) {
    const current = snapshot();
    values.push({
      at: Math.round(performance.now()),
      frames: current.frames,
      camera: current.camera,
    });
    await wait(30);
  }
  return values;
};
const click = (label: string) => {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (candidate) => candidate.getAttribute('aria-label') === label,
  );
  if (!button) throw new Error(`Кнопка «${label}» не найдена`);
  button.click();
};

function ProbePanel() {
  const [result, setResult] = useState<ProbeResult>({ status: 'готово' });
  const [busy, setBusy] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(reducedMotionState.value);
  const run = useCallback(async (operation: () => Promise<ProbeResult>) => {
    setBusy(true);
    try {
      setResult(await operation());
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }, []);
  const checkCamera = () =>
    run(async () => {
      await wait(700);
      const before = snapshot();
      const idleStart = snapshot();
      await wait(700);
      const idleEnd = snapshot();
      click('Вид сверху');
      const topFrames = await framesFor(650);
      await wait(700);
      const topIdle = snapshot();
      click('Сбросить камеру');
      const resetFrames = await framesFor(650);
      await wait(700);
      return {
        before,
        idleDelta: idleEnd.frames.map((frame, index) => frame - (idleStart.frames[index] ?? frame)),
        topFrames,
        topIdle,
        resetFrames,
        resetIdle: snapshot(),
      };
    });
  const repeatMount = () =>
    run(async () => {
      click('Вид сверху');
      await wait(100);
      const currentRoot = window.__probeRoot;
      currentRoot?.unmount();
      await wait(750);
      const during = snapshot();
      const root = createRoot(document.getElementById('root')!);
      window.__probeRoot = root;
      root.render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
      await wait(1000);
      const mounted = snapshot();
      await wait(700);
      return { during, mounted, idle: snapshot() };
    });
  return (
    <aside
      style={{
        position: 'fixed',
        zIndex: 20,
        right: 12,
        bottom: 12,
        width: 360,
        padding: 12,
        background: 'white',
        color: '#111',
        boxShadow: '0 2px 12px #0004',
      }}
    >
      <button type="button" disabled={busy} onClick={checkCamera}>
        Проверить камеру
      </button>{' '}
      <button type="button" disabled={busy} onClick={repeatMount}>
        Повторить mount
      </button>
      <button type="button" disabled={busy} onClick={() => setReducedMotion(toggleReducedMotion())}>
        Уменьшить движение: {reducedMotion ? 'вкл.' : 'выкл.'}
      </button>
      <pre id="audit-result" style={{ maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </aside>
  );
}

declare global {
  interface Window {
    __probeRoot?: Root;
  }
}

const reducedMotionState = { value: false };
const nativeMatchMedia = window.matchMedia.bind(window);
const reducedMotionTarget = new EventTarget();
const reducedMotionQuery = Object.assign(reducedMotionTarget, {
  matches: reducedMotionState.value,
  media: '(prefers-reduced-motion: reduce)',
  onchange: null,
  addListener(listener: EventListenerOrEventListenerObject) {
    reducedMotionTarget.addEventListener('change', listener);
  },
  removeListener(listener: EventListenerOrEventListenerObject) {
    reducedMotionTarget.removeEventListener('change', listener);
  },
}) as MediaQueryList;
Object.defineProperty(reducedMotionQuery, 'matches', {
  configurable: true,
  get: () => reducedMotionState.value,
});
window.matchMedia = ((query: string) => {
  if (query !== '(prefers-reduced-motion: reduce)') return nativeMatchMedia(query);
  return reducedMotionQuery;
}) as typeof window.matchMedia;
const toggleReducedMotion = () => {
  reducedMotionState.value = !reducedMotionState.value;
  reducedMotionTarget.dispatchEvent(new Event('change'));
  return reducedMotionState.value;
};

const panelHost = document.createElement('div');
document.body.append(panelHost);
const panelRoot = createRoot(panelHost);
panelRoot.render(<ProbePanel />);
window.__probeRoot = createRoot(document.getElementById('root')!);
window.__probeRoot.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.__probeRoot?.unmount();
    panelRoot.unmount();
    panelHost.remove();
    window.matchMedia = nativeMatchMedia;
  });
}
