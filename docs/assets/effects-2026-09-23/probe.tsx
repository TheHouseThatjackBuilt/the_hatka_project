import React, { StrictMode, useCallback, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as fiber from '@react-three/fiber';
import { App } from '../../../src/App.tsx';
import '../../../src/styles.css';
import { PERFORMANCE_PROFILES } from '../../../src/viewer/performance.ts';
import { attachAO } from './ao-experiment.ts';
import { attachCutEdges } from './cut-edge-experiment.ts';

let detachAO: (() => void) | undefined;
let detachEdges: (() => void) | undefined;
const selectGraphics = async (label: string) => {
  const trigger = [...document.querySelectorAll<HTMLButtonElement>('[role="combobox"]')].find(
    (item) =>
      document.getElementById(item.getAttribute('aria-labelledby') ?? '')?.textContent ===
      'Графика',
  )!;
  trigger.click();
  await wait(30);
  [...document.querySelectorAll<HTMLElement>('[role="option"]')]
    .find((item) => item.textContent === label)!
    .click();
  await wait(150);
};
const variant = async (name: string) => {
  detachAO?.();
  detachAO = undefined;
  detachEdges?.();
  detachEdges = undefined;
  Object.assign(PERFORMANCE_PROFILES.quality, {
    environmentIntensity: name === 'Окружение' || name === 'Всё' || name === 'AO' ? 0.25 : 0,
    contactShadows: name === 'Контакт' || name === 'Всё' || name === 'AO',
  });
  await selectGraphics('Быстрее');
  await selectGraphics('Качество');
  if (name === 'Кромка' || name === 'AO') detachEdges = attachCutEdges(state());
  if (name === 'AO') detachAO = attachAO(state());
  return { variant: name, ...snapshot() };
};

type FiberEntry = { store: { getState(): any } };
type ProbeResult = Record<string, unknown>;
const roots = () => (fiber as typeof fiber & { _roots?: Map<HTMLElement, FiberEntry> })._roots;
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const appRoot = document.querySelector('#root')!;
const find = (label: string) => {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (candidate) =>
      candidate.getAttribute('aria-label') === label || candidate.textContent?.includes(label),
  );
  if (!button) throw new Error(`Кнопка «${label}» не найдена`);
  return button;
};
const state = () => [...(roots()?.values() ?? [])][0]?.store.getState();
const snapshot = () => {
  const current = state();
  const canvas = document.querySelector<HTMLCanvasElement>('#ap-scene canvas');
  const gl = current?.gl;
  const info = gl?.info;
  const lights: unknown[] = [];
  const materials = new Map<string, unknown>();
  current?.scene?.traverse((object: any) => {
    if (object.isLight)
      lights.push({
        type: object.type,
        position: object.position?.toArray(),
        intensity: object.intensity,
        color: object.color?.getHexString(),
        bias: object.shadow?.bias,
        normalBias: object.shadow?.normalBias,
        mapSize: object.shadow?.mapSize?.toArray(),
        castShadow: object.castShadow,
        map: object.shadow?.map ? [object.shadow.map.width, object.shadow.map.height] : null,
      });
    const material = object.material;
    if (material?.name || material?.color)
      materials.set(material.name || `${material.color?.getHexString()}`, {
        name: material.name,
        color: material.color?.getHexString(),
        roughness: material.roughness,
        metalness: material.metalness,
      });
  });
  let debug: Record<string, unknown> = {};
  try {
    const context = gl?.getContext?.();
    const extension = context?.getExtension('WEBGL_debug_renderer_info');
    debug = {
      renderer: extension ? context?.getParameter(extension.UNMASKED_RENDERER_WEBGL) : undefined,
      vendor: extension ? context?.getParameter(extension.UNMASKED_VENDOR_WEBGL) : undefined,
    };
  } catch {}
  return {
    roots: roots()?.size ?? 0,
    canvases: document.querySelectorAll('canvas').length,
    renderer: {
      colorSpace: gl?.outputColorSpace,
      toneMapping: gl?.toneMapping,
      exposure: gl?.toneMappingExposure,
      shadowMap: gl?.shadowMap?.type,
      shadows: gl?.shadowMap?.enabled,
      antialias: gl?.getContextAttributes?.()?.antialias,
      dpr: current?.viewport?.dpr,
    },
    canvas: canvas
      ? {
          width: canvas.width,
          height: canvas.height,
          cssWidth: canvas.clientWidth,
          cssHeight: canvas.clientHeight,
        }
      : undefined,
    userAgent: navigator.userAgent,
    gpu: debug,
    render: { ...info?.render },
    memory: { ...info?.memory },
    environment: !!current?.scene.environment,
    effects: current?.scene.children
      .filter((object: any) => ['contact-shadows', 'cut-edges'].includes(object.name))
      .map((object: any) => object.name),
    camera: { position: current?.camera.position.toArray(), zoom: current?.camera.zoom },
    lights,
    materials: [...materials.values()],
  };
};
const click = (label: string) => find(label).click();
const measure = async () => {
  const trials: ProbeResult[] = [];
  for (let trial = 0; trial < 3; trial++) {
    click('Сбросить камеру');
    await wait(650);
    const samples: { interval: number; cpu: number; calls: number; triangles: number }[] = [];
    let last = performance.now();
    let submittedAt = last;
    let sampling = false;
    let raf = 0;
    const before = fiber.addEffect(() => {
      if (sampling) submittedAt = performance.now();
    });
    const off = fiber.addAfterEffect(() => {
      if (!sampling) return;
      const now = performance.now();
      const s = state();
      samples.push({
        interval: now - last,
        cpu: now - submittedAt,
        calls: s?.gl.info.render.calls ?? 0,
        triangles: s?.gl.info.render.triangles ?? 0,
      });
      last = now;
    });
    const started = performance.now();
    const rotate = () => {
      click('Повернуть вправо');
      if (performance.now() - started < 4000) raf = requestAnimationFrame(rotate);
    };
    try {
      raf = requestAnimationFrame(rotate);
      await wait(1000);
      sampling = true;
      last = performance.now();
      await wait(3000);
    } finally {
      cancelAnimationFrame(raf);
      before();
      off();
    }
    await wait(650);
    const idleStart = state()?.gl.info.render.frame ?? 0;
    await wait(700);
    const idleEnd = state()?.gl.info.render.frame ?? idleStart;
    const quantiles = (values: number[]) => {
      const sorted = values.sort((a, b) => a - b);
      const percentile = (p: number) =>
        sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
      return { median: percentile(0.5), p95: percentile(0.95) };
    };
    trials.push({
      fps: samples.length / 3,
      interval: quantiles(samples.map((s) => s.interval)),
      cpuSubmission: quantiles(samples.map((s) => s.cpu)),
      idleDelta: idleEnd - idleStart,
      calls: samples.at(-1)?.calls,
      triangles: samples.at(-1)?.triangles,
      samples: samples.length,
    });
  }
  return { trials };
};
function Panel() {
  const [result, setResult] = useState<ProbeResult>({ status: 'готово' });
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn: () => Promise<ProbeResult> | ProbeResult) => {
    setBusy(true);
    try {
      setResult(await fn());
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }, []);
  const repeat = () =>
    run(async () => {
      detachAO?.();
      detachAO = undefined;
      detachEdges?.();
      detachEdges = undefined;
      const root = window.__probeRoot;
      root?.unmount();
      await wait(750);
      const during = snapshot();
      window.__probeRoot = createRoot(appRoot);
      window.__probeRoot.render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
      await wait(1200);
      const mounted = snapshot();
      await wait(700);
      return { during, mounted, idle: snapshot() };
    });
  return (
    <aside
      style={{
        position: 'fixed',
        zIndex: 30,
        top: 55,
        left: 190,
        maxWidth: 400,
        padding: 10,
        background: '#fff',
        color: '#111',
        boxShadow: '0 2px 12px #0004',
      }}
    >
      {['База', 'Окружение', 'Контакт', 'Кромка', 'Всё', 'AO'].map((name) => (
        <button key={name} disabled={busy} onClick={() => run(() => variant(name))}>
          {name}
        </button>
      ))}
      <br />
      <button disabled={busy} onClick={() => run(snapshot)}>
        Состояние
      </button>{' '}
      <button disabled={busy} onClick={() => run(measure)}>
        Замер
      </button>{' '}
      <button disabled={busy} onClick={repeat}>
        Повторить mount
      </button>
      <pre id="audit-result" style={{ maxHeight: 45, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
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
const panelHost = document.createElement('div');
document.body.append(panelHost);
const panelRoot = createRoot(panelHost);
panelRoot.render(<Panel />);
window.__probeRoot = createRoot(appRoot);
window.__probeRoot.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    detachAO?.();
    detachEdges?.();
    window.__probeRoot?.unmount();
    panelRoot.unmount();
    panelHost.remove();
  });
