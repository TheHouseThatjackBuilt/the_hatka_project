import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildApartment } from '../src/modeling/build-apartment.ts';
import { CONCEALED_HEAD, DOOR_ASSEMBLIES, DOOR_DESIGN } from '../src/modeling/shell/doors.ts';
import { PLAN } from '../src/modeling/plan.ts';
import { parseApartmentModel } from '../src/model/parse-model.ts';
import { createSceneResources } from '../src/viewer/scene-resources.ts';
import type { ModelPart } from '../src/model/types.ts';

const model = parseApartmentModel(buildApartment());
const previous = parseApartmentModel(
  JSON.parse(
    readFileSync(new URL('./fixtures/apartment-flooring-2026-09-30.json', import.meta.url), 'utf8'),
  ),
);
const targets = new Map(model.measurements!.targets.map((target) => [target.id, target]));
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 0.000025, `${actual} != ${expected}`);

test('concealed leaves have the user height and are closed flush with the corridor walls', () => {
  for (const [prefix, face, width, facing] of [
    [DOOR_ASSEMBLIES[0].prefix, 1.935, 0.8, 1],
    [DOOR_ASSEMBLIES[1].prefix, 1.935, 0.8, 1],
    [DOOR_ASSEMBLIES[2].prefix, 3.135, 0.923, -1],
    [DOOR_ASSEMBLIES[3].prefix, 6.579, 0.9, -1],
  ] as const) {
    const leaf = model.parts.find((part) => part.name === `${prefix} leaf`)!;
    close(leaf.size[1], 2.4);
    close(leaf.size[2], width - 0.008);
    close(leaf.pos[0] + (facing * leaf.size[0]) / 2, face);
    assert.equal(leaf.rot, 0);
    assert.equal(leaf.mat, 'wall');
    assert.ok(
      !model.parts.some((part) => part.name.startsWith(prefix) && part.shape === 'cylinder'),
    );
    close(leaf.pos[1] + leaf.size[1] / 2 + DOOR_DESIGN.concealedGap, CONCEALED_HEAD);
    for (const seam of model.parts.filter(
      (part) => part.name.startsWith(prefix) && part.name.includes('seam'),
    )) {
      const overlap = [0, 1, 2].map(
        (axis) =>
          Math.min(leaf.pos[axis]! + leaf.size[axis]! / 2, seam.pos[axis]! + seam.size[axis]! / 2) -
          Math.max(leaf.pos[axis]! - leaf.size[axis]! / 2, seam.pos[axis]! - seam.size[axis]! / 2),
      );
      assert.ok(
        overlap.some((extent) => extent <= 0.000001),
        `${seam.name} intersects leaf`,
      );
      assert.ok(
        facing * (seam.pos[0] - face) + seam.size[0] / 2 < 0,
        'seam remains recessed behind the flush face',
      );
    }
  }
  for (const name of [
    'Bathroom 1 east wall lintel',
    'Cloakroom east wall lintel',
    'Hall utility entrance wall lintel',
    'Study partition with door lintel',
  ]) {
    const part = model.parts.find((part) => part.name === name)!;
    close(part.pos[1] - part.size[1] / 2, CONCEALED_HEAD);
    close(part.pos[1] + part.size[1] / 2, 2.7);
  }
});

test('front glass group is 1200 by 2550 mm with equal 2 by 9 leaves, left open and right closed', () => {
  const frame = targets.get('door-living-frame')!;
  close(frame.size[0], 1.2);
  close(frame.size[1], 2.55);
  close(frame.origin[0], (1.935 + 3.135) / 2);
  close(frame.origin[2], PLAN.mainBathroom.north - PLAN.mainBathroom.partition);
  assert.equal(PLAN.living.passage, 1.324);
  const left = targets.get('door-living-left')!;
  const right = targets.get('door-living-right')!;
  close(left.size[0], right.size[0]);
  close(left.size[0], 0.565);
  close(left.size[1], 2.51);
  for (const assembly of DOOR_ASSEMBLIES.slice(5)) {
    const parts = model.parts.filter((part) => part.name.startsWith(`${assembly.prefix} `));
    const panes = parts.filter((part) => part.mat === 'door_glass');
    assert.equal(panes.length, 18);
    assert.equal(parts.filter((part) => part.name.includes('crossbar')).length, 8);
    assert.equal(parts.filter((part) => part.name.includes('centre muntin')).length, 1);
    for (const part of parts) close(part.rot, assembly.rotation);
    if (assembly.id === 'door-living-left') {
      const pivotX = 1.935 + DOOR_DESIGN.frameWidth + DOOR_DESIGN.leafGap;
      for (const pane of panes) {
        close(pane.pos[0], pivotX);
        assert.ok(pane.pos[2] > frame.origin[2] && pane.pos[2] < frame.origin[2] + 0.565);
      }
    }
  }
  // The open leaf's grip remains on the passage side rather than penetrating the bath wall.
  const handle = model.parts.find((part) => part.name === 'Living glazed left leaf handle')!;
  assert.ok(handle.pos[0] - handle.size[2] / 2 > 1.935);
  close(handle.pos[0], 1.967 + DOOR_DESIGN.leafDepth / 2 + 0.016);
  close(handle.pos[2], 3.171 + 0.565 - DOOR_DESIGN.leafBorder / 2);
});

test('compound doors expose seven meaningful objects instead of targets for individual bars and handles', () => {
  for (const assembly of DOOR_ASSEMBLIES) {
    const parts = model.parts.filter((part) => part.name.startsWith(`${assembly.prefix} `));
    assert.ok(parts.length > 1);
    assert.ok(parts.every((part) => part.measurementId === assembly.id));
    assert.equal(targets.get(assembly.id)!.label, assembly.label);
    assert.match(targets.get(assembly.id)!.planSource, /не размер светового прохода/);
  }
  const doorParts = model.parts.filter((part) => part.group === 'doors');
  assert.ok(doorParts.every((part) => part.measurementId && targets.has(part.measurementId)));
  assert.equal(new Set(doorParts.map((part) => part.measurementId)).size, 11);
  assert.equal(model.measurements!.targets.length, 139);
});

test('door rework preserves every other part, all previous materials, floor choices and room footprints', () => {
  const replaced = new Set([
    'Hall utility door open',
    'Hall utility door open hinge',
    'Bathroom 1 door open',
    'Bathroom 1 door open hinge',
    'Cloakroom door open',
    'Cloakroom door open hinge',
    'Study door open',
    'Study door open hinge',
    'Hall utility entrance wall lintel',
    'Bathroom 1 east wall lintel',
    'Cloakroom east wall lintel',
    'Study partition with door lintel',
  ]);
  const unaffected = (parts: ModelPart[]) =>
    JSON.parse(
      JSON.stringify(
        parts.filter(
          (part) =>
            !replaced.has(part.name) &&
            !DOOR_ASSEMBLIES.some((assembly) => part.name.startsWith(`${assembly.prefix} `)),
        ),
        (key, value) => (key === 'measurementId' ? undefined : value),
      ),
    );
  assert.deepEqual(unaffected(model.parts), unaffected(previous.parts));
  assert.deepEqual(model.flooring, previous.flooring);
  assert.deepEqual(model.measurements!.rooms, previous.measurements!.rooms);
  assert.deepEqual(model.labels, previous.labels);
  for (const [key, material] of Object.entries(previous.materials))
    assert.deepEqual(model.materials[key], material);
  const bedroom = (parts: ModelPart[]) =>
    parts.filter(
      (part) => part.name.startsWith('Bedroom sliding') || part.name === 'Bedroom door lintel',
    );
  assert.deepEqual(bedroom(model.parts), bedroom(previous.parts));
});

test('glass relief has independent scene ownership and is disposed once across repeated cleanup', () => {
  const first = createSceneResources(model);
  const second = createSceneResources(model);
  const texture = first.materials.door_glass!.bumpMap!;
  assert.ok(texture);
  assert.notEqual(texture, second.materials.door_glass!.bumpMap);
  let releases = 0;
  texture.addEventListener('dispose', () => releases++);
  first.dispose();
  first.dispose();
  assert.equal(releases, 1);
  assert.ok(second.materials.door_glass!.bumpMap!.image.data.length > 0);
  second.dispose();
});
