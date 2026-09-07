import { Vector3 } from 'three';
import type { Camera } from 'three';
import type { RoomLabel } from '../model/types.ts';
import type { ViewMode } from './types.ts';

const SMALL_ROOMS = new Set(['Санузел', 'Холл', 'Балкон', 'Прихожая', 'Гардеробная']);

export function createRoomLabels(layer: HTMLElement, rooms: RoomLabel[]) {
  const labels = rooms.map(([name, x, z]) => {
    const element = document.createElement('span');
    element.textContent = name;
    layer.append(element);
    return { element, position: new Vector3(x, 0.06, z), name };
  });
  const projected = new Vector3();

  function update(camera: Camera, width: number, height: number, mode: ViewMode, visible: boolean) {
    for (const label of labels) {
      projected.copy(label.position).project(camera);
      label.element.style.left = `${((projected.x + 1) * width) / 2}px`;
      label.element.style.top = `${((1 - projected.y) * height) / 2}px`;
      label.element.hidden =
        !visible ||
        mode === 'full' ||
        (width < 500 && mode !== 'top' && SMALL_ROOMS.has(label.name));
    }
  }

  return { update, dispose: () => layer.replaceChildren() };
}
