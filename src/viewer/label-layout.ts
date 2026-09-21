export interface LabelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelCandidate extends LabelRect {
  priority: number;
  opacity: number;
}

export interface LabelPlacement {
  x: number;
  y: number;
  opacity: number;
}

const GAP = 4;
const overlaps = (a: LabelRect, b: LabelRect) =>
  Math.abs(a.x - b.x) < (a.width + b.width) / 2 + GAP &&
  Math.abs(a.y - b.y) < (a.height + b.height) / 2 + GAP;

// Coordinates are screen-space centres. Original model anchors are never changed.
export function layoutLabels(
  labels: readonly LabelCandidate[],
  width: number,
  height: number,
  maxShift: number,
  obstacles: readonly LabelRect[] = [],
): LabelPlacement[] {
  const occupied = [...obstacles];
  const result = labels.map(({ x, y }) => ({ x, y, opacity: 0 }));
  const ordered = labels.map((label, index) => ({ label, index }));
  ordered.sort((a, b) => b.label.priority - a.label.priority || a.index - b.index);
  for (const { label, index } of ordered) {
    if (
      !Number.isFinite(label.x + label.y + label.width + label.height) ||
      label.opacity <= 0 ||
      label.width <= 0 ||
      label.height <= 0 ||
      label.x < 0 ||
      label.x > width ||
      label.y < 0 ||
      label.y > height
    )
      continue;
    const fits = (rect: LabelRect) =>
      rect.x - rect.width / 2 >= GAP &&
      rect.x + rect.width / 2 <= width - GAP &&
      rect.y - rect.height / 2 >= GAP &&
      rect.y + rect.height / 2 <= height - GAP;
    if (fits(label) && occupied.every((other) => !overlaps(label, other))) {
      occupied.push(label);
      result[index] = { x: label.x, y: label.y, opacity: label.opacity };
      continue;
    }
    // A free rectangle can sit against a viewport/obstacle edge. Include those
    // exact positions instead of a bounded grid that could miss a narrow gap.
    const xs = [label.x, label.width / 2 + GAP, width - label.width / 2 - GAP];
    const ys = [label.y, label.height / 2 + GAP, height - label.height / 2 - GAP];
    for (const other of occupied) {
      xs.push(
        other.x - (other.width + label.width) / 2 - GAP,
        other.x + (other.width + label.width) / 2 + GAP,
      );
      ys.push(
        other.y - (other.height + label.height) / 2 - GAP,
        other.y + (other.height + label.height) / 2 + GAP,
      );
    }
    const positions: LabelRect[] = [];
    for (const y of ys) {
      for (const x of xs) {
        const candidate = { ...label, x, y };
        if (fits(candidate) && Math.hypot(x - label.x, y - label.y) <= maxShift)
          positions.push(candidate);
      }
    }
    positions.sort(
      (a, b) => Math.hypot(a.x - label.x, a.y - label.y) - Math.hypot(b.x - label.x, b.y - label.y),
    );
    const placed = positions.find((rect) => occupied.every((other) => !overlaps(rect, other)));
    if (placed) {
      occupied.push(placed);
      result[index] = { x: placed.x, y: placed.y, opacity: label.opacity };
    }
  }
  return result;
}
