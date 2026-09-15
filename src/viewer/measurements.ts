import { Raycaster, Vector2, Vector3, type Camera, type Mesh } from 'three';
import type { ApartmentModel, Vector3Tuple } from '../model/types.ts';
import type { MeasurementTarget, PlanPoint, PlanRegion } from '../model/measurement-types.ts';
import {
  localToWorld,
  regionArea,
  regionContains,
  regionsDistance,
  worldRegions,
} from '../model/measurement-math.ts';
import { isWorldVisible, pickMeasurementSurface, type PickSurface } from './measurement-picking.ts';
import type { ApartmentMesh, ViewerOptions } from './types.ts';
import type {
  MeasurementCommand,
  MeasurementResult,
  MeasurementSnapshot,
} from './measurement-types.ts';
import type { CanvasMeasurementInteraction } from './controls.ts';
import { CUT_HEIGHT, isClipped } from './scene-resources.ts';
import './measurements.css';

const NS = 'http://www.w3.org/2000/svg';
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const mm = (value: number) => `${number.format(value * 1000)} мм`;
const area = (value: number) => `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} м²`;
type Pointer = { x: number; y: number };
type Segment = { a: Vector3Tuple; b: Vector3Tuple; label?: string; offset?: boolean };

export function createMeasurements(
  viewport: HTMLElement,
  canvas: HTMLCanvasElement,
  model: ApartmentModel,
  meshes: ApartmentMesh[],
  caps: Mesh[],
  initialOptions: ViewerOptions,
  invalidate: () => void,
  onChange: (snapshot: MeasurementSnapshot) => void,
) {
  const data = model.measurements;
  const targets = new Map(data?.targets.map((target) => [target.id, target]));
  const rooms = new Map(data?.rooms.map((room) => [room.id, room]));
  const regions = new Map(data?.targets.map((target) => [target.id, worldRegions(target)]));
  const indices = new Map<string, number[]>();
  model.parts.forEach((part, index) => {
    if (!part.measurementId) return;
    const list = indices.get(part.measurementId) ?? [];
    list.push(index);
    indices.set(part.measurementId, list);
  });
  const overlay = document.createElementNS(NS, 'svg');
  overlay.classList.add('ap-measurements');
  overlay.setAttribute('aria-hidden', 'true');
  viewport.append(overlay);
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    '3D-модель. В режиме размеров: стрелки перемещают указатель, Shift — точный шаг, Enter — выбрать.',
  );
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const projected = new Vector3();
  let options = initialOptions;
  let pointer: Pointer | null = null;
  let pendingTap: Pointer | null = null;
  let dragging = false;
  let suppressed = false;
  let selectedIds: string[] = [];
  let points: Vector3Tuple[] = [];
  let pinned = false;
  let snapshotKey = '';
  let disposed = false;
  let previousVisible = '';
  let distanceCache: { key: string; value: ReturnType<typeof regionsDistance> } | null = null;
  const enabled = () => !!data && options.measurementTool !== 'off' && !disposed;
  const visible = (id: string) =>
    (indices.get(id) ?? []).some((index) => {
      const mesh = meshes[index];
      const part = model.parts[index]!;
      return (
        mesh &&
        isWorldVisible(mesh) &&
        part.group !== 'ceiling' &&
        !(isClipped(part, options.mode) && part.pos[1] - part.size[1] / 2 >= CUT_HEIGHT)
      );
    });

  function clear() {
    selectedIds = [];
    points = [];
    pinned = false;
    pendingTap = null;
    suppressed = true;
    distanceCache = null;
    invalidate();
  }
  function select(id: string, slot?: 0 | 1) {
    if (!enabled()) return;
    if (options.measurementTool === 'rooms') {
      if (rooms.has(id)) {
        selectedIds = [id];
        pinned = true;
      }
    } else if (targets.has(id) && visible(id)) {
      if (options.measurementTool === 'distance') {
        if (slot === 0 || !selectedIds.length) selectedIds = [id];
        else if (id !== selectedIds[0]) selectedIds = [selectedIds[0]!, id];
        pinned = selectedIds.length === 2;
      } else if (options.measurementTool === 'objects') {
        selectedIds = [id];
        pinned = true;
      }
    }
    suppressed = false;
    invalidate();
  }
  const interaction: CanvasMeasurementInteraction = {
    enabled,
    hover(next) {
      if (!enabled()) return;
      if (!pointer || !next || pointer.x !== next.x || pointer.y !== next.y) suppressed = false;
      pointer = next;
      invalidate();
    },
    gesture(active) {
      dragging = active;
      if (enabled()) invalidate();
    },
    tap(next) {
      if (enabled()) {
        pendingTap = next;
        pointer = next;
        suppressed = false;
        invalidate();
      }
    },
  };

  function update(camera: Camera, width: number, height: number) {
    if (disposed) return;
    const availableTargets = [...targets.values()].filter((target) => visible(target.id));
    const visibilityKey = availableTargets.map((target) => target.id).join('|');
    if (previousVisible !== visibilityKey) {
      if (selectedIds.some((id) => targets.has(id) && !visible(id))) clear();
      previousVisible = visibilityKey;
    }
    const surfaces: PickSurface[] = [];
    meshes.forEach((mesh, index) => {
      if (mesh) surfaces.push({ mesh, part: model.parts[index]! });
    });
    caps.forEach((mesh, index) => {
      if (mesh) surfaces.push({ mesh, part: model.parts[index]!, cutCap: true });
    });
    const pick = (position: Pointer | null) => {
      if (!position) return null;
      const rect = canvas.getBoundingClientRect();
      if (
        !rect.width ||
        !rect.height ||
        position.x < rect.left ||
        position.y < rect.top ||
        position.x >= rect.right ||
        position.y >= rect.bottom
      )
        return null;
      ndc.set(
        ((position.x - rect.left) / rect.width) * 2 - 1,
        1 - ((position.y - rect.top) / rect.height) * 2,
      );
      return pickMeasurementSurface(camera, ndc, surfaces, options.mode, raycaster);
    };
    const roomAt = (hit: ReturnType<typeof pick>) =>
      hit?.part.group === 'floor'
        ? [...rooms.values()].find((room) =>
            regionContains([hit.point.x, hit.point.z], room.region),
          )?.id
        : undefined;
    let hit = enabled() && !dragging && !suppressed && !pinned ? pick(pointer) : null;
    if (enabled() && pendingTap) {
      const tapped = pick(pendingTap);
      pendingTap = null;
      if (options.measurementTool === 'points') {
        if (tapped && points.length < 2) {
          points.push(tapped.point.toArray() as Vector3Tuple);
          pinned = points.length === 2;
        } else if (!tapped) clear();
      } else if (!pinned) {
        const id =
          options.measurementTool === 'rooms' ? roomAt(tapped) : tapped?.part.measurementId;
        if (id) select(id);
        else clear();
      } else if (!tapped) clear();
      hit = !pinned && !suppressed ? tapped : null;
    }
    const activeIds = [...selectedIds];
    if (!pinned && !suppressed && hit) {
      const id = options.measurementTool === 'rooms' ? roomAt(hit) : hit.part.measurementId;
      if (id && !activeIds.includes(id)) activeIds.push(id);
    }
    let result: MeasurementResult | null = null;
    const segments: Segment[] = [];
    const outlines: { region: PlanRegion; y: number }[] = [];
    const dots: Vector3Tuple[] = [];
    function targetOutline(target: MeasurementTarget) {
      for (const region of regions.get(target.id) ?? [])
        outlines.push({ region, y: target.origin[1] - target.size[1] / 2 + 0.01 });
    }
    if (enabled() && options.measurementTool === 'objects') {
      const target = targets.get(activeIds[0] ?? '');
      if (target) {
        targetOutline(target);
        const [w, h, d] = target.size;
        result = {
          title: target.label,
          values: target.diameter
            ? [
                { label: 'Диаметр', value: mm(target.diameter) },
                { label: 'Высота', value: mm(h) },
              ]
            : [
                { label: target.kind === 'wall' ? 'Длина участка' : 'Ширина', value: mm(w) },
                { label: target.kind === 'wall' ? 'Толщина' : 'Глубина', value: mm(d) },
                { label: 'Высота', value: mm(h) },
              ],
          note: `На плане: ${target.planSource}. Высота: ${target.heightSource}. Полный размер по модели.`,
        };
        const p = (x: number, y: number, z: number) => localToWorld(target, [x, y, z]);
        segments.push(
          { a: p(-w / 2, -h / 2, -d / 2), b: p(w / 2, -h / 2, -d / 2), label: mm(w), offset: true },
          { a: p(w / 2, -h / 2, -d / 2), b: p(w / 2, -h / 2, d / 2), label: mm(d), offset: true },
        );
        if (options.mode !== 'top')
          segments.push({
            a: p(w / 2, -h / 2, d / 2),
            b: p(w / 2, h / 2, d / 2),
            label: mm(h),
            offset: true,
          });
      }
    } else if (enabled() && options.measurementTool === 'rooms') {
      const room = rooms.get(activeIds[0] ?? '');
      if (room) {
        outlines.push({ region: room.region, y: 0.035 });
        const sides = room.region.outer.map((a, i) => {
          const b = room.region.outer[(i + 1) % room.region.outer.length]!;
          const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
          segments.push({
            a: [a[0], 0.035, a[1]],
            b: [b[0], 0.035, b[1]],
            label: mm(length),
            offset: true,
          });
          return { label: `Сторона ${i + 1}`, value: mm(length) };
        });
        result = {
          title: room.label,
          values: [
            { label: 'Площадь', value: area(regionArea(room.region)) },
            ...sides,
            { label: 'Высота', value: mm(room.height) },
          ],
          note: `${room.source}. Высота: ${room.heightSource}. Площадь включает места под мебелью.`,
        };
      }
    } else if (enabled() && options.measurementTool === 'distance') {
      for (const id of activeIds.slice(0, 2)) {
        const target = targets.get(id);
        if (target) targetOutline(target);
      }
      const a = targets.get(activeIds[0] ?? ''),
        b = targets.get(activeIds[1] ?? '');
      if (a && b) {
        const key = `${a.id}|${b.id}`;
        if (distanceCache?.key !== key)
          distanceCache = { key, value: regionsDistance(regions.get(a.id)!, regions.get(b.id)!) };
        const distance = distanceCache.value;
        if (distance) {
          const value =
            distance.status === 'overlapping'
              ? 'Контуры перекрываются'
              : distance.status === 'touching'
                ? 'Касание'
                : mm(distance.distance);
          result = {
            title: `${a.label} → ${b.label}`,
            values: [{ label: 'На плане', value }],
            note: `Между контурами модели; округлые формы приближены с точностью до 1 мм для пары. Высота и препятствия между предметами не учитываются. Основания: ${a.planSource}; ${b.planSource}.`,
          };
          segments.push({
            a: [distance.a[0], 0.045, distance.a[1]],
            b: [distance.b[0], 0.045, distance.b[1]],
            label: value,
          });
        }
      } else if (a)
        result = {
          title: a.label,
          values: [],
          note: 'Первый объект выбран. Выберите второй на модели или в списке.',
        };
    } else if (enabled() && options.measurementTool === 'points') {
      const activePoints = [...points];
      if (!pinned && hit) activePoints.push(hit.point.toArray() as Vector3Tuple);
      dots.push(...activePoints);
      const a = activePoints[0],
        b = activePoints[1];
      if (a && b) {
        const dx = b[0] - a[0],
          dy = b[1] - a[1],
          dz = b[2] - a[2];
        result = {
          title: 'Между выбранными точками',
          values: [
            { label: 'В пространстве', value: mm(Math.hypot(dx, dy, dz)) },
            { label: 'На плане', value: mm(Math.hypot(dx, dz)) },
            { label: 'Разница высот', value: mm(Math.abs(dy)) },
          ],
          note: 'Точки на поверхности модели. Уточняйте положение масштабированием; размеры модели могут быть схематичными.',
        };
        segments.push({ a, b, label: mm(Math.hypot(dx, dy, dz)) });
      }
    }
    const snapshot: MeasurementSnapshot = {
      available: !!data,
      objects: availableTargets.map(({ id, label }) => ({ id, label })),
      rooms: [...rooms.values()].map(({ id, label }) => ({ id, label })),
      selectedIds: [...selectedIds],
      pinned,
      pointCount: points.length,
      result,
    };
    const key = JSON.stringify(snapshot);
    if (key !== snapshotKey) {
      snapshotKey = key;
      onChange(snapshot);
    }
    overlay.replaceChildren();
    overlay.style.display = enabled() ? 'block' : 'none';
    canvas.style.cursor = dragging ? 'grabbing' : enabled() ? 'crosshair' : 'grab';
    if (!enabled() || !width || !height) return;
    overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const project = (point: Vector3Tuple): PlanPoint | null => {
      projected.set(...point).project(camera);
      return Number.isFinite(projected.x + projected.y + projected.z) && Math.abs(projected.z) <= 1
        ? [((projected.x + 1) * width) / 2, ((1 - projected.y) * height) / 2]
        : null;
    };
    const element = (name: string, attrs: Record<string, string>, text?: string) => {
      const node = document.createElementNS(NS, name);
      for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
      if (text) node.textContent = text;
      overlay.append(node);
      return node;
    };
    const line = (a: PlanPoint, b: PlanPoint, extra: Record<string, string> = {}) => {
      const attrs = {
        x1: String(a[0]),
        y1: String(a[1]),
        x2: String(b[0]),
        y2: String(b[1]),
        ...extra,
      };
      element('line', { ...attrs, class: 'guide' });
      return element('line', { ...attrs, class: 'line' });
    };
    for (const { region, y } of outlines)
      for (const ring of [region.outer, ...(region.holes ?? [])]) {
        const coords = ring.map(([x, z]) => project([x, y, z]));
        if (coords.every((p) => p !== null))
          element('polygon', {
            points: coords.map((p) => p!.join(',')).join(' '),
            class: 'outline',
          });
      }
    const occupied: PlanPoint[] = [];
    for (const segment of segments) {
      const a = project(segment.a),
        b = project(segment.b);
      if (!a || !b) continue;
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        length = Math.hypot(dx, dy);
      if (length < 1) continue;
      const nx = -dy / length,
        ny = dx / length,
        offset = segment.offset ? 18 : 0;
      const aa: PlanPoint = [a[0] + nx * offset, a[1] + ny * offset],
        bb: PlanPoint = [b[0] + nx * offset, b[1] + ny * offset];
      if (offset) {
        line(a, aa, { 'stroke-opacity': '0.5' });
        line(b, bb, { 'stroke-opacity': '0.5' });
      }
      line(aa, bb);
      for (const p of [aa, bb])
        line([p[0] - nx * 4, p[1] - ny * 4], [p[0] + nx * 4, p[1] + ny * 4]);
      const pos: PlanPoint = [(aa[0] + bb[0]) / 2, (aa[1] + bb[1]) / 2 - 5];
      if (
        segment.label &&
        length > 36 &&
        pos[0] > 45 &&
        pos[0] < width - 45 &&
        pos[1] > 16 &&
        pos[1] < height - 8 &&
        !occupied.some((p) => Math.abs(p[0] - pos[0]) < 72 && Math.abs(p[1] - pos[1]) < 22)
      ) {
        element(
          'text',
          {
            x: String(pos[0]),
            y: String(pos[1]),
            'text-anchor': 'middle',
            class: 'label',
          },
          segment.label,
        );
        occupied.push(pos);
      }
    }
    for (const point of dots) {
      const p = project(point);
      if (p)
        element('circle', {
          cx: String(p[0]),
          cy: String(p[1]),
          r: '4',
          class: 'point',
        });
    }
    if (document.activeElement === canvas && pointer) {
      const rect = canvas.getBoundingClientRect();
      const p: PlanPoint = [pointer.x - rect.left, pointer.y - rect.top];
      line([p[0] - 7, p[1]], [p[0] + 7, p[1]]);
      line([p[0], p[1] - 7], [p[0], p[1] + 7]);
    }
  }
  return {
    interaction,
    update,
    command(command: MeasurementCommand) {
      if (command.type === 'clear') clear();
      else select(command.id, command.slot);
    },
    setOptions(next: ViewerOptions) {
      if (next.measurementTool !== options.measurementTool) {
        clear();
        suppressed = false;
      }
      if (next.mode !== options.mode || next.furnitureVisible !== options.furnitureVisible) {
        pendingTap = null;
        pointer = null;
        if (points.length) clear();
      }
      options = next;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      overlay.remove();
    },
  };
}
