import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseApartmentModel } from '../src/model/parse-model.ts';
import { buildApartment } from '../src/modeling/build-apartment.ts';
import { createModelBuilder } from '../src/modeling/core/builder.ts';
import { roundTo } from '../src/modeling/core/round.ts';
import { buildKitchen } from '../src/modeling/rooms/kitchen.ts';
import { buildStudy } from '../src/modeling/rooms/study.ts';
import { serializeApartment } from '../src/modeling/export/index.ts';

// JSON.stringify canonicalizes -0 to 0; both describe the same model rotation.
const baseline = parseApartmentModel(
  JSON.parse(
    readFileSync(new URL('./fixtures/apartment-before-ts.json', import.meta.url), 'utf8'),
    (_key, value: unknown) => (Object.is(value, -0) ? 0 : value),
  ),
);
const currentBaseline = parseApartmentModel(
  JSON.parse(
    readFileSync(new URL('./fixtures/apartment-plan-2026-09-10.json', import.meta.url), 'utf8'),
  ),
);

test('generation matches the reviewed final-plan fixture, materials and labels', () => {
  const model = parseApartmentModel(buildApartment());
  assert.equal(model.parts.length, 619);
  assert.deepEqual(model, currentBaseline);
});

test('repeated generation is independent, including nested arrays and materials', () => {
  const first = buildApartment(),
    second = buildApartment();
  assert.deepEqual(first, second);
  first.parts[0]!.pos[0] = 100;
  first.parts.pop();
  first.materials.wall![1] = '#000000';
  first.labels[0]![0] = 'Changed';
  first.metadata.ceilingHeight = 99;
  assert.deepEqual(second, currentBaseline);
  assert.deepEqual(buildApartment(), currentBaseline);
});

test('room builders do not share their collection or depend on the order of other rooms', () => {
  const kitchen = createModelBuilder(),
    study = createModelBuilder(),
    again = createModelBuilder();
  buildKitchen(kitchen);
  const originalKitchen = structuredClone(kitchen.parts);
  buildStudy(study);
  buildKitchen(again);
  study.parts[0]!.pos[0] = -100;
  assert.deepEqual(kitchen.parts, originalKitchen);
  assert.deepEqual(again.parts, originalKitchen);
  assert.ok(study.parts.length > 0);
});

test('rounding preserves nearest-even and the actual binary fraction of the source', () => {
  for (const [value, digits, expected] of [
    [0.125, 2, 0.12],
    [0.375, 2, 0.38],
    [-0.125, 2, -0.12],
    [2.675, 2, 2.67],
    [2.5, 0, 2],
    [3.5, 0, 4],
    [-2.5, 0, -2],
    [0.0000001, 5, 0],
    [5e-324, 6, 0],
    [Number.MAX_VALUE, 6, Number.MAX_VALUE],
  ]) {
    assert.equal(roundTo(value!, digits!), expected);
  }
});

test('builder rejects invalid or rounded-to-zero dimensions before export', () => {
  const model = createModelBuilder();
  for (const size of [0, -1, Infinity, NaN, 0.00000001]) {
    assert.throws(() => model.box('Invalid box', 0, 0, size, 1, 1));
  }
  assert.throws(() => model.box('Invalid position', NaN, 0, 1, 1, 1));
  assert.equal(model.parts.length, 0);
});

test('rotating a fixture changes only the parts added for that fixture', () => {
  const model = createModelBuilder();
  model.box('Untouched', 0, 0, 1, 1, 1);
  const untouched = structuredClone(model.parts[0]);
  const first = model.parts.length;
  model.box('Fixture', 1.5, 2.5, 1, 1, 1);
  model.rotateParts(first, 1, 1, Math.PI / 2);
  assert.deepEqual(model.parts[0], untouched);
  assert.deepEqual(model.parts[1]!.pos, [3, 0.5, 0]);
  assert.equal(model.parts[1]!.rot, roundTo(Math.PI / 2, 6));
});

function canonical(value: unknown): unknown {
  if (typeof value === 'number') return Number(value.toFixed(12));
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
}

test('exports match independent fingerprints captured from the Python generator', () => {
  const signatures = JSON.parse(
    readFileSync(new URL('./fixtures/exports-before-ts.json', import.meta.url), 'utf8'),
  ) as Record<string, string>;
  // Export the frozen fixture to keep this test focused on serializer compatibility.
  const original = structuredClone(baseline);
  const files = serializeApartment(baseline);
  const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
  const glb = files['apartment.glb'];
  const jsonLength = new DataView(glb.buffer).getUint32(12, true);
  const doc: unknown = JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLength)));
  assert.equal(hash(JSON.stringify(canonical(doc))), signatures.glbDocument);
  assert.equal(hash(glb.subarray(28 + jsonLength)), signatures.glbBinary);
  assert.equal(hash(files['apartment.obj']), signatures.obj);
  assert.equal(hash(files['apartment.mtl']), signatures.mtl);
  assert.deepEqual(JSON.parse(files['model.json']), baseline);
  assert.deepEqual(baseline, original, 'serializers must not mutate their input');
  assert.deepEqual(serializeApartment(baseline), files);
});
