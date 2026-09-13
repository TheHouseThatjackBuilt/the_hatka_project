import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidRegion,
  localToWorld,
  regionArea,
  regionContains,
  regionsDistance,
  worldRegions,
} from '../src/model/measurement-math.ts';
import type { MeasurementTarget, PlanRegion } from '../src/model/measurement-types.ts';

const rect = (x: number, z: number, w: number, d: number): PlanRegion => ({
  outer: [
    [x, z],
    [x + w, z],
    [x + w, z + d],
    [x, z + d],
  ],
});
test('contains and area include outer boundary and exclude holes', () => {
  const r = {
    outer: [
      [0, 0],
      [4, 0],
      [4, 3],
      [0, 3],
    ] as [number, number][],
    holes: [
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
      ] as [number, number][],
    ],
  };
  assert.equal(regionArea(r), 11);
  assert.equal(regionContains([0, 1], r), true);
  assert.equal(regionContains([1.5, 1.5], r), false);
});
test('distance detects gap, touching, crossing, and containment', () => {
  assert.equal(regionsDistance([rect(0, 0, 2, 2)], [rect(3, 0, 2, 2)])?.distance, 1);
  assert.equal(regionsDistance([rect(0, 0, 2, 2)], [rect(2, 0, 2, 2)])?.status, 'touching');
  assert.equal(regionsDistance([rect(0, 0, 3, 3)], [rect(1, -1, 1, 5)])?.status, 'overlapping');
  assert.equal(regionsDistance([rect(0, 0, 4, 4)], [rect(1, 1, 1, 1)])?.status, 'overlapping');
});
test('transforms use three.js Y rotation convention', () => {
  const target = {
    origin: [10, 2, 20],
    rotation: Math.PI / 2,
    footprint: [rect(0, 0, 2, 1)],
  } as unknown as MeasurementTarget;
  assert.deepEqual(localToWorld(target, [1, 3, 0]), [10, 5, 19]);
  assert.deepEqual(worldRegions(target)[0]!.outer[1], [10, 18]);
});
test('validates simple regions and rejects self intersections and bad holes', () => {
  assert.equal(isValidRegion(rect(0, 0, 2, 2)), true);
  assert.equal(
    isValidRegion({
      outer: [
        [0, 0],
        [2, 2],
        [0, 2],
        [2, 0],
      ],
    }),
    false,
  );
  assert.equal(
    isValidRegion({
      outer: [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ],
      holes: [
        [
          [0, 1],
          [1, 1],
          [1, 2],
          [0, 2],
        ],
      ],
    }),
    false,
  );
});

test('distance witnesses agree with the result, including union components and coincident edges', () => {
  const cases: [PlanRegion[], PlanRegion[], string, number][] = [
    [[rect(0, 0, 1, 1), rect(10, 10, 4, 4)], [rect(11, 11, 1, 1)], 'overlapping', 0],
    [[rect(0, 0, 3, 2)], [rect(1, 0, 3, 2)], 'overlapping', 0],
    [[rect(0, 0, 3, 2)], [rect(0, 0, 3, 2)], 'overlapping', 0],
    [[rect(0, 0, 1, 1)], [rect(2, 2, 1, 1)], 'separated', Math.SQRT2],
    [[rect(0, 0, 2, 2)], [rect(2, 1, 2, 2)], 'touching', 0],
    [
      [{ ...rect(0, 0, 10, 10), holes: [rect(2, 2, 6, 6).outer] }],
      [rect(3, 3, 1, 1)],
      'separated',
      1,
    ],
    [[rect(0, 0, 4, 1)], [rect(1, -1, 1, 3)], 'overlapping', 0],
  ];
  for (const [a, b, status, d] of cases)
    for (const [first, second] of [
      [a, b],
      [b, a],
    ] as const) {
      const result = regionsDistance(first, second)!;
      assert.equal(result.status, status);
      assert.ok(Math.abs(result.distance - d) < 1e-7);
      assert.ok(
        Math.abs(Math.hypot(result.a[0] - result.b[0], result.a[1] - result.b[1]) - d) < 1e-7,
      );
      assert.ok(first.some((r) => regionContains(result.a, r)));
      assert.ok(second.some((r) => regionContains(result.b, r)));
    }
});

test('all malformed or intersecting holes are rejected without throwing', () => {
  for (const holes of [
    null,
    {},
    'bad',
    [1],
    [[1, 2, 3]],
    [rect(1, 1, 3, 3).outer, rect(2, 2, 1, 1).outer],
    [rect(1, 1, 3, 3).outer, rect(3, 3, 2, 2).outer],
  ])
    assert.equal(isValidRegion({ ...rect(0, 0, 8, 8), holes }), false);
  const r = { ...rect(0, 0, 8, 8), holes: [rect(2, 2, 3, 3).outer] };
  assert.equal(isValidRegion(r), true);
  assert.equal(regionContains([2, 3], r), true);
});
