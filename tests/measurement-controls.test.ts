import test from 'node:test';
import assert from 'node:assert/strict';
import { bindCanvasControls } from '../src/viewer/controls.ts';
import type { CameraController } from '../src/viewer/camera.ts';
import { OrthographicCamera } from 'three';

class MockCanvas extends EventTarget {
  style = { cursor: '' };
  captures = new Set<number>();
  setPointerCapture(id: number) {
    this.captures.add(id);
  }
  releasePointerCapture(id: number) {
    this.captures.delete(id);
  }
  hasPointerCapture(id: number) {
    return this.captures.has(id);
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 };
  }
}
const camera = (): CameraController => ({
  camera: new OrthographicCamera(),
  update() {},
  advance() {},
  stop() {},
  reset() {},
  setReducedMotion() {},
  fit() {},
  setMode() {},
  panPixels() {},
  rotate() {},
  zoomAt() {},
});
const pointer = (
  type: string,
  id: number,
  x: number,
  y: number,
  extra: Record<string, unknown> = {},
) => {
  const e = new Event(type, { cancelable: true });
  Object.assign(e, {
    pointerId: id,
    clientX: x,
    clientY: y,
    button: 0,
    shiftKey: false,
    pointerType: 'mouse',
    ...extra,
  });
  return e;
};
const interaction = () => {
  const calls: { kind: string; point?: unknown }[] = [];
  return {
    calls,
    api: {
      enabled: () => true,
      hover: (point: unknown) => calls.push({ kind: 'hover', point }),
      gesture: (active: boolean) => calls.push({ kind: active ? 'gesture-on' : 'gesture-off' }),
      tap: (point: unknown) => calls.push({ kind: 'tap', point }),
    },
  };
};

test('tap fires, drag over five pixels does not', () => {
  const c = new MockCanvas(),
    m = interaction();
  bindCanvasControls(c as unknown as HTMLCanvasElement, camera(), m.api);
  c.dispatchEvent(pointer('pointerdown', 1, 10, 10));
  c.dispatchEvent(pointer('pointerup', 1, 12, 13));
  c.dispatchEvent(pointer('pointerdown', 2, 10, 10));
  c.dispatchEvent(pointer('pointermove', 2, 16, 10));
  c.dispatchEvent(pointer('pointerup', 2, 16, 10));
  assert.equal(m.calls.filter((x) => x.kind === 'tap').length, 1);
});

test('cancel and lost capture finish the gesture', () => {
  const c = new MockCanvas(),
    m = interaction();
  bindCanvasControls(c as unknown as HTMLCanvasElement, camera(), m.api);
  c.dispatchEvent(pointer('pointerdown', 1, 10, 10));
  c.dispatchEvent(pointer('pointercancel', 1, 10, 10));
  c.dispatchEvent(pointer('pointerdown', 2, 20, 20));
  c.dispatchEvent(pointer('lostpointercapture', 2, 20, 20));
  assert.equal(m.calls.filter((x) => x.kind === 'gesture-off').length, 2);
  assert.equal(m.calls.filter((x) => x.kind === 'tap').length, 0);
});

test('second pointer cancels subject tap selection', () => {
  const c = new MockCanvas(),
    m = interaction();
  bindCanvasControls(c as unknown as HTMLCanvasElement, camera(), m.api);
  c.dispatchEvent(pointer('pointerdown', 1, 10, 10, { pointerType: 'touch' }));
  c.dispatchEvent(pointer('pointerdown', 2, 30, 10, { pointerType: 'touch' }));
  c.dispatchEvent(pointer('pointerup', 1, 10, 10, { pointerType: 'touch' }));
  c.dispatchEvent(pointer('pointerup', 2, 30, 10, { pointerType: 'touch' }));
  assert.equal(m.calls.filter((x) => x.kind === 'tap').length, 0);
});

test('dispose removes all pointer processing', () => {
  const c = new MockCanvas(),
    m = interaction(),
    controls = bindCanvasControls(c as unknown as HTMLCanvasElement, camera(), m.api);
  controls.dispose();
  c.dispatchEvent(pointer('pointerdown', 1, 10, 10));
  c.dispatchEvent(pointer('pointerup', 1, 10, 10));
  assert.equal(m.calls.filter((x) => x.kind === 'tap').length, 0);
  assert.equal(m.calls.at(-1)?.kind, 'gesture-off');
});
