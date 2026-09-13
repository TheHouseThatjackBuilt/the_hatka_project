import type { CameraController } from './camera.ts';

interface Point {
  x: number;
  y: number;
}
interface Drag extends Point {
  pan: boolean;
}
interface Pinch extends Point {
  distance: number;
}

export interface CanvasMeasurementInteraction {
  enabled(): boolean;
  hover(point: Point | null): void;
  gesture(active: boolean): void;
  tap(point: Point): void;
}

// React handles toolbar events; this module owns only canvas pointer gestures.
export function bindCanvasControls(
  canvas: HTMLCanvasElement,
  camera: CameraController,
  measurement?: CanvasMeasurementInteraction,
) {
  const events = new AbortController();
  function on<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options: AddEventListenerOptions = {},
  ) {
    canvas.addEventListener(type, listener, { ...options, signal: events.signal });
  }

  let panMode = false;
  const pointers = new Map<number, Point>();
  let drag: Drag | null = null;
  let pinch: Pinch | null = null;
  let tapCandidate: (Point & { id: number }) | null = null;
  let keyboardPoint: Point | null = null;
  const idleCursor = () => (measurement?.enabled() ? 'crosshair' : 'grab');

  function gesture(): Pinch | null {
    const [a, b] = [...pointers.values()];
    if (!a || !b) return null;
    return { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  on('pointerdown', (event) => {
    if (event.button > 2 || pointers.size >= 2) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 0 && event.button === 0 && !event.shiftKey && !panMode)
      tapCandidate = { x: event.clientX, y: event.clientY, id: event.pointerId };
    else tapCandidate = null;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    measurement?.gesture(true);
    drag = {
      x: event.clientX,
      y: event.clientY,
      pan: panMode || event.button === 2 || event.button === 1 || event.shiftKey,
    };
    canvas.style.cursor = 'grabbing';
    if (pointers.size === 2) pinch = gesture();
  });
  on('pointermove', (event) => {
    keyboardPoint = null;
    if (!pointers.has(event.pointerId)) {
      if (event.pointerType !== 'touch') measurement?.hover({ x: event.clientX, y: event.clientY });
      return;
    }
    if (
      tapCandidate &&
      Math.hypot(event.clientX - tapCandidate.x, event.clientY - tapCandidate.y) > 5
    )
      tapCandidate = null;
    if (measurement?.enabled() && tapCandidate) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const next = gesture();
      if (!next) return;
      if (pinch) {
        camera.panPixels(next.x - pinch.x, next.y - pinch.y);
        if (pinch.distance > 0) camera.zoomAt(next.distance / pinch.distance, next.x, next.y);
      }
      pinch = next;
    } else if (drag) {
      const dx = event.clientX - drag.x,
        dy = event.clientY - drag.y;
      if (drag.pan || event.shiftKey) camera.panPixels(dx, dy);
      else camera.rotate(-dx * 0.007, dy * 0.005);
    }
    drag = { x: event.clientX, y: event.clientY, pan: drag?.pan ?? panMode };
  });

  function release(event: PointerEvent) {
    if (!pointers.delete(event.pointerId)) return;
    const tap =
      event.type === 'pointerup' &&
      tapCandidate?.id === event.pointerId &&
      Math.hypot(event.clientX - tapCandidate.x, event.clientY - tapCandidate.y) <= 5;
    tapCandidate = null;
    const remaining = [...pointers.values()][0];
    drag = remaining ? { ...remaining, pan: panMode } : null;
    pinch = null;
    canvas.style.cursor = remaining ? 'grabbing' : idleCursor();
    if (!remaining) {
      measurement?.gesture(false);
      if (tap) measurement?.tap({ x: event.clientX, y: event.clientY });
      if (event.pointerType === 'touch' || event.type !== 'pointerup') measurement?.hover(null);
      else measurement?.hover({ x: event.clientX, y: event.clientY });
    }
  }
  on('pointerup', release);
  on('pointercancel', release);
  on('lostpointercapture', release);
  on('pointerleave', () => {
    if (!pointers.size) measurement?.hover(null);
  });
  on('keydown', (event) => {
    if (!measurement?.enabled()) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key))
      return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    keyboardPoint ??= { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const step = event.shiftKey ? 1 : 10;
    if (event.key === 'ArrowLeft') keyboardPoint.x -= step;
    if (event.key === 'ArrowRight') keyboardPoint.x += step;
    if (event.key === 'ArrowUp') keyboardPoint.y -= step;
    if (event.key === 'ArrowDown') keyboardPoint.y += step;
    keyboardPoint.x = Math.max(rect.left, Math.min(rect.right - 1, keyboardPoint.x));
    keyboardPoint.y = Math.max(rect.top, Math.min(rect.bottom - 1, keyboardPoint.y));
    measurement.hover({ ...keyboardPoint });
    if (event.key === 'Enter' || event.key === ' ') measurement.tap({ ...keyboardPoint });
  });
  on('contextmenu', (event) => event.preventDefault());
  on(
    'wheel',
    (event) => {
      event.preventDefault();
      camera.zoomAt(Math.exp(-event.deltaY * 0.001), event.clientX, event.clientY);
    },
    { passive: false },
  );

  return {
    setPanMode(value: boolean) {
      panMode = value;
    },
    dispose() {
      events.abort();
      for (const id of pointers.keys()) {
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      }
      pointers.clear();
      tapCandidate = null;
      measurement?.gesture(false);
    },
  };
}
