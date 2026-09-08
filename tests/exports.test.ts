import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, BufferGeometry, Material, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { buildApartment } from '../src/modeling/build-apartment.ts';
import { serializeGlb } from '../src/modeling/export/glb.ts';
import { serializeObj } from '../src/modeling/export/obj.ts';

test('GLB imports as two independent scenes with correct transforms and ceiling membership', async (t) => {
  const model = buildApartment();
  const gltf = await new GLTFLoader().parseAsync(serializeGlb(model).buffer, '');
  const geometries = new Set<BufferGeometry>(),
    materials = new Set<Material>();
  t.after(() => {
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  });
  assert.equal(gltf.scenes.length, 2);
  assert.equal(gltf.scene, gltf.scenes[0]);
  const objects = new Set();
  gltf.scenes.forEach((scene, sceneIndex) => {
    let meshCount = 0,
      ceilingCount = 0;
    const seenByGroup = new Map<string, number>();
    scene.traverse((object) => {
      assert.ok(!objects.has(object), 'scene trees must not share objects');
      objects.add(object);
      if (!(object instanceof Mesh)) return;
      meshCount++;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        materials.add(material);
      // The exporter retains source ordering within each category. Do not depend
      // on GLTFLoader's private association cache, which is reduced per scene.
      const category = object.userData.category as string;
      const partIndex = seenByGroup.get(category) ?? 0;
      seenByGroup.set(category, partIndex + 1);
      const part = model.parts.filter((item) => item.group === category)[partIndex];
      assert.ok(part);
      assert.deepEqual(object.position.toArray(), part.pos);
      assert.deepEqual(object.scale.toArray(), part.size);
      assert.ok(Math.abs(object.quaternion.y - Math.sin(part.rot / 2)) < 1e-12);
      assert.ok(Math.abs(object.quaternion.w - Math.cos(part.rot / 2)) < 1e-12);
      assert.equal(object.userData.category, part.group);
      if (part.group === 'ceiling') ceilingCount++;
      const expectedMaterial = model.materials[part.mat]!;
      assert.ok(!Array.isArray(object.material));
      assert.equal(object.material.opacity, expectedMaterial[2]);
      const position = object.geometry.getAttribute('position');
      assert.ok(position && position.count > 0);
      for (let i = 0; i < position.count; i++) {
        assert.ok(
          Number.isFinite(position.getX(i)) &&
            Number.isFinite(position.getY(i)) &&
            Number.isFinite(position.getZ(i)),
        );
      }
    });
    assert.equal(meshCount, model.parts.length - (sceneIndex === 0 ? 2 : 0));
    assert.equal(ceilingCount, sceneIndex === 0 ? 0 : 2);
  });
});

test('OBJ imports all non-ceiling parts in world space, including a rotated primitive', () => {
  const model = buildApartment();
  const { obj } = serializeObj(model);
  const imported = new OBJLoader().parse(obj);
  const parts = model.parts.filter((part) => part.group !== 'ceiling');
  assert.equal(imported.children.length, parts.length);
  imported.children.forEach((child, index) => {
    assert.ok(child instanceof Mesh);
    const part = parts[index]!;
    const bounds = new Box3().setFromObject(child);
    assert.ok(!bounds.isEmpty());
    const center = bounds.getCenter(new Vector3());
    assert.ok(center.distanceTo(new Vector3(...part.pos)) < 0.00002, part.name);
    assert.ok(!Array.isArray(child.material));
    assert.equal(child.material.name, part.mat);
    child.geometry.dispose();
    child.material.dispose();
  });
});
