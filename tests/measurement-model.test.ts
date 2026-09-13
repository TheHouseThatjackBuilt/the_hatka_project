import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildApartment } from '../src/modeling/build-apartment.ts';
import { makeMeasurementTarget } from '../src/modeling/core/measurement-target.ts';
import { parseApartmentModel } from '../src/model/parse-model.ts';
import { regionArea, regionsDistance, worldRegions } from '../src/model/measurement-math.ts';
import type { ModelPart } from '../src/model/types.ts';

const model = buildApartment();
const targets = new Map(model.measurements!.targets.map((target) => [target.id, target]));
test('measurement metadata preserves all reviewed geometry and covers every furniture part', () => {
  const old = JSON.parse(
    readFileSync(new URL('./fixtures/apartment-plan-2026-09-10.json', import.meta.url), 'utf8'),
  );
  const geometry = JSON.parse(
    JSON.stringify(model, (key, value) =>
      ['measurementId', 'measurements'].includes(key) ? undefined : value,
    ),
  );
  assert.deepEqual(geometry, old);
  assert.equal(targets.size, 136);
  assert.ok(
    model.parts
      .filter((part) => part.group === 'furniture')
      .every((part) => part.measurementId && targets.has(part.measurementId)),
  );
  assert.equal(
    new Set(
      model.parts.filter((part) => part.name.startsWith('Sofa ')).map((part) => part.measurementId),
    ).size,
    1,
  );
  assert.notEqual(targets.get('sofa')!.id, targets.get('tv-console')!.id);
});
test('whole-object dimensions and room areas use reviewed internal coordinates', () => {
  for (const [id, w, d] of [
    ['sofa', 3.122, 1.15],
    ['bed', 1.8, 2.1],
    ['hall-wardrobe', 2.866, 0.65],
    ['living-table', 0.5, 0.5],
    ['dining-table', 0.9, 0.9],
  ] as const) {
    const target = targets.get(id)!;
    assert.ok(Math.abs(target.size[0] - w) < 0.000025, id);
    assert.ok(Math.abs(target.size[2] - d) < 0.000025, id);
  }
  const expected = new Map([
    ['room-study', 3.278 * 3.168],
    ['room-bedroom', 3.219 * 3.181],
    ['room-main-bathroom', 1.835 * 2.405],
    ['room-ensuite', 1.621 * 1.502],
  ]);
  for (const room of model.measurements!.rooms)
    assert.ok(Math.abs(regionArea(room.region) - expected.get(room.id)!) < 1e-8, room.id);
  for (const [a, b, expected] of [
    ['sofa', 'tv-console', 1.621],
    ['bedroom-desk', 'bed', 0.569],
  ] as const) {
    const result = regionsDistance(worldRegions(targets.get(a)!), worldRegions(targets.get(b)!))!;
    assert.ok(Math.abs(result.distance - expected) < 0.000025, `${a} ${b}: ${result.distance}`);
  }
});
test('a rotated off-origin box retains its own dimensions and footprint', () => {
  const part: ModelPart = {
    name: 'box',
    shape: 'box',
    pos: [7, 1, 9],
    size: [2, 1, 0.8],
    rot: Math.PI / 4,
    mat: 'wall',
    group: 'furniture',
  };
  const target = makeMeasurementTarget([part], {
    id: 'rotated',
    label: 'Box',
    kind: 'object',
    rotation: part.rot,
    planSource: 'test',
    heightSource: 'test',
  });
  target.size.forEach((size, i) => assert.ok(Math.abs(size - part.size[i]!) < 1e-10));
  target.origin.forEach((value, i) => assert.ok(Math.abs(value - part.pos[i]!) < 1e-10));
  const polygon = worldRegions(target)[0]!.outer;
  assert.ok(polygon.every(([x, z]) => Math.abs(x - 7) < 1.5 && Math.abs(z - 9) < 1.5));
});
test('metadata parser rejects unknown references and malformed regions but supports old models', () => {
  assert.doesNotThrow(() => parseApartmentModel(model));
  for (const mutate of [
    (copy: typeof model) => {
      copy.parts[0]!.measurementId = 'missing';
    },
    (copy: typeof model) => {
      copy.measurements!.targets[1]!.id = copy.measurements!.targets[0]!.id;
    },
    (copy: typeof model) => {
      copy.measurements!.targets[0]!.size[0] = -1;
    },
    (copy: typeof model) => {
      copy.measurements!.rooms[0]!.region.outer[1] = copy.measurements!.rooms[0]!.region.outer[0]!;
    },
  ]) {
    const copy = structuredClone(model);
    mutate(copy);
    assert.throws(() => parseApartmentModel(copy));
  }
});
