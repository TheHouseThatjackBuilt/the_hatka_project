import test from 'node:test';
import assert from 'node:assert/strict';
import { OrthographicCamera, Vector3 } from 'three';
import { layoutLabels, type LabelCandidate, type LabelRect } from '../src/viewer/label-layout.ts';
import { floorPixelScale } from '../src/viewer/label-projection.ts';

const candidate = (overrides: Partial<LabelCandidate> = {}): LabelCandidate => ({
  x: 100,
  y: 80,
  width: 40,
  height: 20,
  priority: 1,
  opacity: 1,
  ...overrides,
});

const overlaps = (a: LabelRect, b: LabelRect, gap = 4) =>
  Math.abs(a.x - b.x) < (a.width + b.width) / 2 + gap &&
  Math.abs(a.y - b.y) < (a.height + b.height) / 2 + gap;

const rectAt = (label: LabelCandidate, placement: { x: number; y: number }): LabelRect => ({
  x: placement.x,
  y: placement.y,
  width: label.width,
  height: label.height,
});

test('gives the higher priority label a slot even when it comes second', () => {
  const labels = [
    candidate({ x: 30, y: 20, priority: 1 }),
    candidate({ x: 30, y: 20, priority: 10 }),
  ];
  const result = layoutLabels(labels, 60, 40, 0);

  assert.equal(result[1]?.opacity, 1);
  assert.equal(result[0]?.opacity, 0);
});

test('keeps duplicate labels independent and separates their placements', () => {
  const labels = [candidate(), candidate()];
  const result = layoutLabels(labels, 260, 180, 100);

  assert.equal(result[0]?.opacity, 1);
  assert.equal(result[1]?.opacity, 1);
  assert.ok(result[0] && result[1]);
  assert.notDeepEqual(result[0], result[1]);
  assert.equal(overlaps(rectAt(labels[0]!, result[0]!), rectAt(labels[1]!, result[1]!)), false);
});

test('places nine clustered labels within the viewport without intersections', () => {
  const labels = Array.from({ length: 9 }, () => candidate({ x: 250, y: 150 }));
  const result = layoutLabels(labels, 500, 300, 200);
  const placed = result
    .map((placement, index) => ({ placement, label: labels[index]! }))
    .filter(({ placement }) => placement.opacity > 0);

  assert.equal(placed.length, 9);
  for (const { placement, label } of placed) {
    assert.ok(placement.x - label.width / 2 >= 4);
    assert.ok(placement.x + label.width / 2 <= 496);
    assert.ok(placement.y - label.height / 2 >= 4);
    assert.ok(placement.y + label.height / 2 <= 296);
  }
  for (let i = 0; i < placed.length; i++)
    for (let j = i + 1; j < placed.length; j++)
      assert.equal(
        overlaps(
          rectAt(placed[i]!.label, placed[i]!.placement),
          rectAt(placed[j]!.label, placed[j]!.placement),
        ),
        false,
      );
});

test('avoids SVG obstacles while placing a label', () => {
  const label = candidate({ x: 100, y: 80 });
  const obstacle: LabelRect = { x: 100, y: 80, width: 70, height: 40 };
  const [placement] = layoutLabels([label], 260, 180, 100, [obstacle]);

  assert.equal(placement?.opacity, 1);
  assert.ok(placement);
  assert.equal(overlaps(rectAt(label, placement), obstacle), false);
});

test('hides invalid, offscreen, transparent, and impossible labels', () => {
  const labels = [
    candidate({ x: Number.NaN }),
    candidate({ x: -1 }),
    candidate({ x: 100, y: 80, opacity: 0 }),
  ];
  const result = layoutLabels(labels, 200, 160, 100);

  assert.deepEqual(
    result.map(({ opacity }) => opacity),
    [0, 0, 0],
  );
  assert.equal(layoutLabels([candidate({ x: 10, y: 10 })], 20, 20, 100)[0]?.opacity, 0);
});

test('does not mutate inputs and returns deterministic placements', () => {
  const labels = [candidate({ x: 120 }), candidate({ x: 125, priority: 2 })];
  const obstacles: LabelRect[] = [{ x: 40, y: 40, width: 20, height: 20 }];
  const labelsBefore = structuredClone(labels);
  const obstaclesBefore = structuredClone(obstacles);

  const first = layoutLabels(labels, 300, 200, 90, obstacles);
  const second = layoutLabels(labels, 300, 200, 90, obstacles);

  assert.deepEqual(labels, labelsBefore);
  assert.deepEqual(obstacles, obstaclesBefore);
  assert.deepEqual(first, second);
});

const cameraFor = (position: Vector3, zoom = 1) => {
  const camera = new OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
  camera.position.copy(position);
  camera.zoom = zoom;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
};

test('floor pixel scale follows orthographic zoom and floor foreshortening', () => {
  const base = floorPixelScale(cameraFor(new Vector3(5, 5, 5)), 800, 600);
  const zoomed = floorPixelScale(cameraFor(new Vector3(5, 5, 5), 2), 800, 600);
  assert.ok(Math.abs(zoomed / base - 2) < 1e-9);
  const farther = floorPixelScale(cameraFor(new Vector3(10, 10, 10)), 800, 600);
  assert.ok(Math.abs(farther - base) < 1e-9);
  const shallow = floorPixelScale(cameraFor(new Vector3(0, 0.2, 5)), 800, 600);
  assert.ok(shallow < base);
  assert.equal(floorPixelScale(cameraFor(new Vector3(5, 5, 5)), 0, 600), 0);
  assert.equal(floorPixelScale(cameraFor(new Vector3(5, 5, 5)), 800, 0), 0);
});

test('fits nine mobile top-view room labels around UI and SVG obstacles', () => {
  // Representative rounded-up dimensions from the 390x844 baseline capture.
  const widths = [101, 60, 60, 59, 59, 85, 69, 40, 54];
  const labels = widths.map((width, index) => ({
    x: 195,
    y: 250,
    width,
    height: 24,
    priority: widths.length - index,
    opacity: 1,
  }));
  const obstacles: LabelRect[] = [
    { x: 195, y: 155, width: 390, height: 100 },
    { x: 195, y: 746, width: 390, height: 300 },
    { x: 267, y: 346, width: 100, height: 24 },
  ];
  const result = layoutLabels(labels, 390, 844, 844, obstacles);
  const placed = result.map((placement, index) => ({ placement, label: labels[index]! }));

  assert.equal(placed.filter(({ placement }) => placement.opacity > 0).length, 9);
  for (const { placement, label } of placed) {
    assert.ok(placement.x - label.width / 2 >= 4);
    assert.ok(placement.x + label.width / 2 <= 386);
    assert.ok(placement.y - label.height / 2 >= 4);
    assert.ok(placement.y + label.height / 2 <= 840);
    for (const obstacle of obstacles)
      assert.equal(overlaps(rectAt(label, placement), obstacle), false);
  }
  for (let i = 0; i < placed.length; i++)
    for (let j = i + 1; j < placed.length; j++)
      assert.equal(
        overlaps(
          rectAt(placed[i]!.label, placed[i]!.placement),
          rectAt(placed[j]!.label, placed[j]!.placement),
        ),
        false,
      );
});
