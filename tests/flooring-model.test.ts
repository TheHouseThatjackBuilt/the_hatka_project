import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseApartmentModel } from '../src/model/parse-model.ts';
import { buildApartment } from '../src/modeling/build-apartment.ts';
import { serializeApartment } from '../src/modeling/export/index.ts';
import type { ApartmentModel } from '../src/model/types.ts';

const previous = parseApartmentModel(
  JSON.parse(
    readFileSync(
      new URL('./fixtures/apartment-measurements-2026-09-10.json', import.meta.url),
      'utf8',
    ),
  ),
);

test('floor preparation preserves the reviewed model and binary/text exports', () => {
  const current = parseApartmentModel(buildApartment());
  const projected = JSON.parse(
    JSON.stringify(current, (key, value) =>
      ['flooring', 'floorSurfaceId'].includes(key) ? undefined : value,
    ),
  );
  assert.deepEqual(projected, previous);
  const before = serializeApartment(previous);
  const after = serializeApartment(current);
  for (const name of ['apartment.glb', 'apartment.obj', 'apartment.mtl'] as const)
    assert.deepEqual(after[name], before[name], name);
  assert.deepEqual(parseApartmentModel(JSON.parse(after['model.json'])), current);
});

test('finish IDs cover surfaces and their joints, leaving slabs and thresholds separate', () => {
  const model = buildApartment();
  const surfaces = new Map(model.flooring!.surfaces.map((surface) => [surface.id, surface]));
  assert.equal(surfaces.size, 5);
  for (const part of model.parts) {
    if (part.group !== 'floor' || part.mat === 'slab' || part.mat === 'stone') {
      assert.equal(part.floorSurfaceId, undefined, part.name);
      continue;
    }
    assert.ok(part.floorSurfaceId && surfaces.has(part.floorSurfaceId), part.name);
    if (part.name.startsWith('Timber')) assert.equal(part.floorSurfaceId, 'apartment-main');
    if (part.name.startsWith('Bathroom 1')) assert.equal(part.floorSurfaceId, 'main-bathroom');
    if (part.name.startsWith('Bathroom 2')) assert.equal(part.floorSurfaceId, 'ensuite');
    if (part.name.startsWith('Entrance tile')) assert.equal(part.floorSurfaceId, 'entrance-inlay');
    if (part.name === 'Balcony surface') assert.equal(part.floorSurfaceId, 'balcony');
  }
  const shared = model.flooring!.coverings[0]!.id;
  for (const id of ['apartment-main', 'main-bathroom', 'entrance-inlay'])
    assert.equal(surfaces.get(id)!.coveringId, shared);
  assert.equal(surfaces.get('ensuite')!.coveringId, null);
  assert.equal(surfaces.get('balcony')!.coveringId, null);
});

test('comparison formats use metres without inventing a product or chosen layout', () => {
  const flooring = buildApartment().flooring!;
  assert.equal(flooring.status, 'draft');
  const covering = flooring.coverings[0]!;
  assert.deepEqual(covering.formats, [
    { id: '20x120', width: 0.2, length: 1.2 },
    { id: '20x60', width: 0.2, length: 0.6 },
  ]);
  assert.deepEqual(covering.layout, {});
  assert.equal(covering.product, undefined);
});

test('floor metadata is independent between generations and optional for older models', () => {
  const first = buildApartment();
  const next = buildApartment();
  first.flooring!.coverings[0]!.formats[0]!.width = 99;
  first.flooring!.coverings[0]!.layout.origin = [42, 43];
  first.flooring!.surfaces[0]!.coveringId = null;
  first.parts.find((part) => part.floorSurfaceId)!.floorSurfaceId = 'changed';
  assert.deepEqual(next, buildApartment());
  assert.doesNotThrow(() => parseApartmentModel(previous));
});

test('floor parser rejects dangling, duplicated and misplaced references', () => {
  const mutations: ((model: ApartmentModel) => void)[] = [
    (model) => {
      delete model.flooring;
    },
    (model) => {
      model.flooring!.version = 2 as 1;
    },
    (model) => {
      model.flooring!.coverings.push(structuredClone(model.flooring!.coverings[0]!));
    },
    (model) => {
      model.flooring!.surfaces.push(structuredClone(model.flooring!.surfaces[0]!));
    },
    (model) => {
      model.flooring!.surfaces[0]!.coveringId = 'missing';
    },
    (model) => {
      model.parts.find((part) => part.floorSurfaceId)!.floorSurfaceId = 'missing';
    },
    (model) => {
      model.parts.find((part) => part.group === 'furniture')!.floorSurfaceId = 'apartment-main';
    },
    (model) => {
      model.flooring!.surfaces.push({
        id: 'orphan',
        label: 'Orphan',
        coveringId: null,
        source: 'Test',
      });
    },
  ];
  for (const mutate of mutations) {
    const copy = buildApartment();
    mutate(copy);
    assert.throws(() => parseApartmentModel(copy));
  }
});

test('floor parser accepts selected layouts and rejects invalid dimensions and layout values', () => {
  const model = buildApartment();
  const covering = model.flooring!.coverings[0]!;
  covering.layout = {
    formatId: '20x60',
    direction: 'z',
    rowOffset: 1 / 3,
    groutWidth: 0.002,
    groutColor: '#afa08b',
    origin: [-1, 2],
  };
  covering.product = { manufacturer: 'Example', url: 'https://example.com/tile' };
  assert.doesNotThrow(() => parseApartmentModel(model));
  const mutations: ((model: ApartmentModel) => void)[] = [
    (copy) => {
      copy.flooring!.coverings[0]!.formats[0]!.width = 0;
    },
    (copy) => {
      copy.flooring!.coverings[0]!.formats[0]!.length = Infinity;
    },
    (copy) => {
      copy.flooring!.coverings[0]!.formats[1]!.id = '20x120';
    },
    (copy) => {
      copy.flooring!.coverings[0]!.layout.formatId = 'missing';
    },
    (copy) => {
      copy.flooring!.coverings[0]!.layout.direction = ['x'] as unknown as 'x';
    },
    (copy) => {
      copy.flooring!.coverings[0]!.layout.rowOffset = 1;
    },
    (copy) => {
      copy.flooring!.coverings[0]!.layout.rowOffset = -0.1;
    },
    (copy) => {
      copy.flooring!.coverings[0]!.layout.groutWidth = 0.2;
    },
    (copy) => {
      copy.flooring!.coverings[0]!.layout.groutWidth = -0.001;
    },
    (copy) => {
      copy.flooring!.coverings[0]!.layout.groutColor = 'brown';
    },
    (copy) => {
      copy.flooring!.coverings[0]!.layout.origin = [NaN, 0];
    },
    (copy) => {
      copy.flooring!.coverings[0]!.product!.url = 'javascript:alert(1)';
    },
    (copy) => {
      copy.flooring!.coverings[0]!.product!.manufacturer = ' ';
    },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(model);
    mutate(copy);
    assert.throws(() => parseApartmentModel(copy));
  }
});
