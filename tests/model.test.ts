import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseApartmentModel } from '../src/model/parse-model.ts';

const model = parseApartmentModel(
  JSON.parse(
    readFileSync(new URL('../public/models/apartment/model.json', import.meta.url), 'utf8'),
  ),
);
const part = model.parts[0];
assert.ok(part);

const invalidModels: [string, unknown][] = [
  ['missing model', null],
  ['wrong units', { ...model, metadata: { ...model.metadata, units: 'mm' } }],
  ['empty geometry', { ...model, parts: [] }],
  ['unknown geometry', { ...model, parts: [{ ...part, shape: 'torus' }] }],
  ['missing material', { ...model, parts: [{ ...part, mat: 'nonexistent' }] }],
  ['nonpositive dimensions', { ...model, parts: [{ ...part, size: [1, 0, 1] }] }],
  ['nonfinite coordinates', { ...model, parts: [{ ...part, pos: [1, NaN, 2] }] }],
  ['invalid label', { ...model, labels: [['Room', 'x', 1]] }],
];

for (const [name, data] of invalidModels) {
  test(`model loading rejects ${name} before allocating a scene`, () => {
    assert.throws(() => parseApartmentModel(data), /Invalid apartment model data/);
  });
}
