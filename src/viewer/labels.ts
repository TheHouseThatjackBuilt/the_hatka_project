import { Vector3 } from 'three';
import type { Camera } from 'three';
import type { RoomLabel } from '../model/types.ts';
import type { ViewMode } from './types.ts';
import { layoutLabels, type LabelRect } from './label-layout.ts';
import { floorPixelScale } from './label-projection.ts';
import './labels.css';

// Presentation priorities agreed in D3; they make no claim about room areas.
const PRIMARY_ROOMS = new Set(['Кухня-гостиная', 'Кабинет', 'Спальня']);
const NS = 'http://www.w3.org/2000/svg';

export function createRoomLabels(layer: HTMLElement, rooms: RoomLabel[], invalidate = () => {}) {
  const leaders = document.createElementNS(NS, 'svg');
  leaders.classList.add('room-label-leaders');
  leaders.setAttribute('aria-hidden', 'true');
  layer.append(leaders);
  const labels = rooms.map(([name, x, z]) => {
    const element = document.createElement('span');
    const primary = PRIMARY_ROOMS.has(name);
    element.className = `room-label${primary ? ' room-label--primary' : ''}`;
    element.setAttribute('aria-hidden', 'true');
    element.textContent = name;
    const leader = document.createElementNS(NS, 'line');
    leaders.append(leader);
    layer.append(element);
    return { element, leader, position: new Vector3(x, 0.06, z), primary };
  });
  const projected = new Vector3();
  let disposed = false;
  // Re-measure after the local font arrives, including on a cold first load.
  void document.fonts.ready.then(() => {
    if (!disposed) invalidate();
  });

  function update(camera: Camera, width: number, height: number, mode: ViewMode, visible: boolean) {
    if (disposed) return;
    const enabled = visible && mode !== 'full' && width > 0 && height > 0;
    const scale = floorPixelScale(camera, width, height);
    const progress = Math.max(0, Math.min(1, (scale - 32) / 20));
    const secondaryOpacity = progress * progress * (3 - 2 * progress);
    // Read every box before moving any label to avoid repeated layout flushes.
    const candidates = labels.map((label) => {
      projected.copy(label.position).project(camera);
      return {
        x: ((projected.x + 1) * width) / 2,
        y: ((1 - projected.y) * height) / 2,
        width: label.element.offsetWidth,
        height: label.element.offsetHeight,
        priority: label.primary ? 1 : 0,
        opacity:
          enabled && Math.abs(projected.z) <= 1
            ? mode === 'top' || label.primary
              ? 1
              : secondaryOpacity
            : 0,
      };
    });
    const bounds = layer.getBoundingClientRect();
    const obstacles: LabelRect[] = Array.from(
      layer.parentElement?.querySelectorAll<SVGTextElement>('.ap-measurements .label') ?? [],
      (element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left - bounds.left + rect.width / 2,
          y: rect.top - bounds.top + rect.height / 2,
          width: rect.width + 4,
          height: rect.height + 4,
        };
      },
    );
    // Keep displaced names out from under the permanent viewer panels.
    for (const panel of layer
      .closest('#apartment-view')
      ?.querySelectorAll(
        '.page-header, .viewer-view-panel, .viewer-settings-panel, .measurement-panel, #ap-camera, #ap-footer',
      ) ?? []) {
      const rect = panel.getBoundingClientRect();
      if (rect.width && rect.height)
        obstacles.push({
          x: rect.left - bounds.left + rect.width / 2,
          y: rect.top - bounds.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
    }
    const placed = layoutLabels(
      candidates,
      width,
      height,
      mode === 'top' ? Math.max(width, height) : 40,
      obstacles,
    );
    for (const [index, label] of labels.entries()) {
      const anchor = candidates[index]!;
      const target = placed[index]!;
      label.element.style.opacity = String(target.opacity);
      label.element.setAttribute('aria-hidden', String(target.opacity === 0));
      if (Number.isFinite(target.x + target.y)) {
        label.element.style.left = `${target.x}px`;
        label.element.style.top = `${target.y}px`;
      }
      const shifted = Math.hypot(target.x - anchor.x, target.y - anchor.y) > 4;
      label.leader.style.opacity = String(shifted ? target.opacity * 0.65 : 0);
      if (target.opacity && shifted) {
        label.leader.setAttribute('x1', String(anchor.x));
        label.leader.setAttribute('y1', String(anchor.y));
        label.leader.setAttribute(
          'x2',
          String(
            Math.max(target.x - anchor.width / 2, Math.min(target.x + anchor.width / 2, anchor.x)),
          ),
        );
        label.leader.setAttribute(
          'y2',
          String(
            Math.max(
              target.y - anchor.height / 2,
              Math.min(target.y + anchor.height / 2, anchor.y),
            ),
          ),
        );
      }
    }
  }

  return {
    update,
    dispose: () => {
      disposed = true;
      layer.replaceChildren();
    },
  };
}
