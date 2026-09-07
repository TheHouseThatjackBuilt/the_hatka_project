import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { TestContext } from 'node:test';
import { Vector3 } from 'three';
import { createApartmentScene } from '../src/viewer/scene.ts';
import { createCameraController } from '../src/viewer/camera.ts';
import { parseApartmentModel } from '../src/model/parse-model.ts';

const model = parseApartmentModel(
  JSON.parse(
    readFileSync(new URL('../public/models/apartment/model.json', import.meta.url), 'utf8'),
  ),
);

function setup(t: TestContext, width = 1200, height = 700) {
  const apartment = createApartmentScene(model);
  t.after(() => apartment.dispose());
  const area = {
    clientWidth: width,
    clientHeight: height,
    getBoundingClientRect: () => ({ left: 20, top: 100, width, height }),
  };
  const controller = createCameraController(area, apartment.meshes, () => {});
  return { apartment, controller, area };
}

test('all original objects retain geometry, materials and transforms', (t) => {
  const { apartment } = setup(t);
  assert.equal(model.parts.length, 566);
  assert.equal(model.metadata.ceilingHeight, 2.7);
  assert.equal(apartment.meshes.length, model.parts.length);
  apartment.meshes.forEach((mesh, index) => {
    const part = model.parts[index];
    assert.ok(part);
    const material = model.materials[part.mat];
    assert.ok(material);
    assert.equal(mesh.name, part.name);
    assert.deepEqual(mesh.position.toArray(), part.pos);
    assert.deepEqual(mesh.scale.toArray(), part.size);
    assert.equal(mesh.rotation.y, part.rot);
    assert.equal(`#${mesh.material.color.getHexString()}`, material[1]);
  });
  assert.equal(apartment.scene.getObjectByName('ceiling')?.visible, false);
});

test('cutaway hides wall cabinets and full-height mode restores them', (t) => {
  const { apartment } = setup(t);
  const cabinet = apartment.meshes.find((mesh) => mesh.name === 'Kitchen wall cabinet 1');
  const wall = apartment.meshes.find((mesh) => mesh.name === 'West exterior');
  assert.ok(cabinet);
  assert.ok(wall);
  apartment.setMode('cut');
  assert.equal(cabinet.visible, false);
  assert.equal(wall.material.clippingPlanes?.[0]?.constant, 1.05);
  apartment.setMode('full');
  assert.equal(cabinet.visible, true);
  assert.equal(wall.material.clippingPlanes?.length, 0);
  assert.equal(apartment.scene.getObjectByName('ceiling')?.visible, false);
});

test('hiding furniture also hides its cut surfaces across mode changes', (t) => {
  const { apartment } = setup(t);
  apartment.setMode('cut');
  apartment.setFurnitureVisible(false);
  apartment.setMode('full');
  apartment.setMode('top');
  assert.equal(apartment.scene.getObjectByName('furniture')?.visible, false);
  let caps = 0;
  apartment.scene.traverse((object) => {
    if (object.userData.group === 'furniture' && !object.userData.shape) {
      caps++;
      assert.equal(object.visible, false);
    }
  });
  assert.ok(caps > 0);
  apartment.setFurnitureVisible(true);
  assert.equal(apartment.scene.getObjectByName('furniture')?.visible, true);
});

for (const [width, height] of [
  [1200, 700],
  [360, 500],
]) {
  test(`fit keeps visible model inside the viewport at ${width}×${height}`, (t) => {
    const { apartment, controller } = setup(t, width, height);
    for (const mode of ['cut', 'full', 'top'] as const) {
      apartment.setMode(mode);
      controller.setMode(mode);
      controller.update();
      for (const mesh of apartment.meshes) {
        if (!mesh.visible || !mesh.parent?.visible) continue;
        mesh.updateWorldMatrix(true, false);
        for (const x of [-0.5, 0.5])
          for (const y of [-0.5, 0.5])
            for (const z of [-0.5, 0.5]) {
              const point = new Vector3(x, y, z).applyMatrix4(mesh.matrixWorld);
              if (
                mode !== 'full' &&
                ['walls', 'windows', 'doors', 'furniture'].includes(mesh.parent.name)
              ) {
                point.y = Math.min(point.y, 1.05);
              }
              point.project(controller.camera);
              assert.ok(
                Math.abs(point.x) <= 0.881 && Math.abs(point.y) <= 0.881,
                `${mode}: ${mesh.name} outside viewport`,
              );
            }
      }
    }
  });
}

test('zoom preserves the world point under the cursor, including consecutive wheel events', (t) => {
  const { controller, area } = setup(t);
  controller.setMode('cut');
  controller.update();
  const anchor = new Vector3(0.3, -0.2, 0).unproject(controller.camera);
  const rect = area.getBoundingClientRect();
  const x = rect.left + rect.width * 0.65;
  const y = rect.top + rect.height * 0.6;
  for (const factor of [1.15, 1.15, 0.8, 1.4]) controller.zoomAt(factor, x, y);
  controller.update();
  const projected = anchor.project(controller.camera);
  assert.ok(Math.abs(projected.x - 0.3) < 1e-9);
  assert.ok(Math.abs(projected.y + 0.2) < 1e-9);
});
