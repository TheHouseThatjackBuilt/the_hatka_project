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

// React handles toolbar events; this module owns only canvas pointer gestures.
export function bindCanvasControls(canvas: HTMLCanvasElement, camera: CameraController) {
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

  function gesture(): Pinch | null {
    const [a, b] = [...pointers.values()];
    if (!a || !b) return null;
    return { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  on('pointerdown', (event) => {
    if (event.button > 2 || pointers.size >= 2) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    drag = {
      x: event.clientX,
      y: event.clientY,
      pan: panMode || event.button === 2 || event.button === 1 || event.shiftKey,
    };
    canvas.style.cursor = 'grabbing';
    if (pointers.size === 2) pinch = gesture();
  });
  on('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
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
    const remaining = [...pointers.values()][0];
    drag = remaining ? { ...remaining, pan: panMode } : null;
    pinch = null;
    canvas.style.cursor = remaining ? 'grabbing' : 'grab';
  }
  on('pointerup', release);
  on('pointercancel', release);
  on('lostpointercapture', release);
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
    },
  };
}
