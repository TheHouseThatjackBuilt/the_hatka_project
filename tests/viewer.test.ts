import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { buildApartment } from '../src/modeling/build-apartment.ts';
import type { ApartmentModel } from '../src/model/types.ts';
import { ApartmentScene } from '../src/viewer/ApartmentScene.tsx';
import { createCameraController } from '../src/viewer/camera.ts';
import { DEFAULT_VIEWER_OPTIONS } from '../src/viewer/options.ts';
import type { ApartmentMesh, ViewerOptions } from '../src/viewer/types.ts';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

extend({
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  HemisphereLight: THREE.HemisphereLight,
  DirectionalLight: THREE.DirectionalLight,
});
const model = buildApartment();
const sceneElement = (model: ApartmentModel, options: ViewerOptions, meshes: ApartmentMesh[]) =>
  React.createElement(ApartmentScene, { model, options, meshes });

async function setup(width = 1200, height = 700) {
  const meshes: ApartmentMesh[] = [];
  const options: ViewerOptions = { ...DEFAULT_VIEWER_OPTIONS };
  const scene = () => React.createElement(ApartmentScene, { model, options, meshes });
  const renderer = await ReactThreeTestRenderer.create(scene());
  const area = {
    clientWidth: width,
    clientHeight: height,
    getBoundingClientRect: () => ({ left: 20, top: 100, width, height }),
  };
  const controller = createCameraController(area, meshes, () => {});
  return { renderer, meshes, options, controller, area };
}

test('all model objects retain geometry, materials and transforms in R3F scene', async (t) => {
  const { renderer, meshes } = await setup();
  t.after(() => renderer.unmount());
  assert.equal(model.metadata.ceilingHeight, 2.7);
  assert.equal(meshes.length, model.parts.length);
  meshes.forEach((mesh, index) => {
    const part = model.parts[index]!;
    const material = model.materials[part.mat]!;
    assert.equal(mesh.name, part.name);
    assert.deepEqual(mesh.position.toArray(), part.pos);
    assert.deepEqual(mesh.scale.toArray(), part.size);
    assert.equal(mesh.rotation.y, part.rot);
    assert.equal(`#${mesh.material.color.getHexString()}`, material[1]);
  });
  assert.equal(renderer.scene.findByProps({ name: 'ceiling' }).instance.visible, false);
});

test('mode, furniture, labels and pan updates preserve meshes and resources', async (t) => {
  const { renderer, meshes, options } = await setup();
  t.after(() => renderer.unmount());
  const originalMeshes = [...meshes];
  const geometries = meshes.map((mesh) => mesh.geometry);
  const materials = meshes.map((mesh) => mesh.material);
  for (const mode of ['cut', 'full', 'top'] as const) {
    const nextOptions = {
      ...options,
      mode,
      furnitureVisible: false,
      labelsVisible: false,
      panMode: true,
    };
    await renderer.update(sceneElement(model, nextOptions, meshes));
    meshes.forEach((mesh, index) => assert.equal(mesh, originalMeshes[index]));
    assert.equal(renderer.scene.findByProps({ name: 'furniture' }).instance.visible, false);
    meshes.forEach((mesh, index) => {
      assert.equal(mesh.geometry, geometries[index]);
      assert.equal(mesh.material, materials[index]);
    });
  }
  const nextOptions = { ...options, furnitureVisible: true, labelsVisible: true, panMode: false };
  await renderer.update(sceneElement(model, nextOptions, meshes));
  assert.equal(renderer.scene.findByProps({ name: 'furniture' }).instance.visible, true);
});

test('cutaway hides wall cabinets and full-height mode restores them', async (t) => {
  const { renderer, meshes, options } = await setup();
  t.after(() => renderer.unmount());
  const cabinet = () => meshes.find((mesh) => mesh.name === 'Kitchen wall cabinet 1')!;
  const wall = () => meshes.find((mesh) => mesh.name === 'West exterior')!;
  await renderer.update(sceneElement(model, { ...options, mode: 'cut' }, meshes));
  assert.equal(cabinet().visible, false);
  assert.equal(wall().material.clippingPlanes?.[0]?.constant, 1.05);
  await renderer.update(sceneElement(model, { ...options, mode: 'full' }, meshes));
  assert.equal(cabinet().visible, true);
  assert.equal(wall().material.clippingPlanes?.length, 0);
});

for (const [width, height] of [
  [1200, 700],
  [360, 500],
]) {
  test(`fit keeps visible model inside viewport at ${width}×${height}`, async (t) => {
    const { renderer, meshes, controller, options } = await setup(width, height);
    t.after(() => renderer.unmount());
    for (const mode of ['cut', 'full', 'top'] as const) {
      await renderer.update(sceneElement(model, { ...options, mode }, meshes));
      controller.setMode(mode);
      controller.update();
      for (const mesh of meshes) {
        if (!mesh.visible || !mesh.parent?.visible) continue;
        mesh.updateWorldMatrix(true, false);
        for (const x of [-0.5, 0.5])
          for (const y of [-0.5, 0.5])
            for (const z of [-0.5, 0.5]) {
              const point = new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld);
              if (
                mode !== 'full' &&
                ['walls', 'windows', 'doors', 'furniture'].includes(mesh.parent.name)
              )
                point.y = Math.min(point.y, 1.05);
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

test('directional light target has expected world coordinates', async (t) => {
  const { renderer } = await setup();
  t.after(() => renderer.unmount());
  const light = renderer.scene.instance.children.find(
    (node) => node instanceof THREE.DirectionalLight && node.castShadow,
  ) as THREE.DirectionalLight;
  assert.ok(light);
  const target = light.target;
  target.updateWorldMatrix(true, false);
  assert.deepEqual(target.getWorldPosition(new THREE.Vector3()).toArray(), [5, 0, 4]);
});

test('furniture cut caps follow furniture visibility and mode', async (t) => {
  const { renderer, meshes, options } = await setup();
  t.after(() => renderer.unmount());
  const caps = () =>
    renderer.scene
      .findByProps({ name: 'cutCaps' })
      .children.filter((node) => node.instance.userData.group === 'furniture');
  await renderer.update(
    sceneElement(model, { ...options, mode: 'cut', furnitureVisible: true }, meshes),
  );
  assert.ok(caps().length > 0);
  assert.ok(caps().every((node) => node.instance.visible));
  await renderer.update(
    sceneElement(model, { ...options, mode: 'top', furnitureVisible: false }, meshes),
  );
  assert.ok(caps().every((node) => !node.instance.visible));
  await renderer.update(
    sceneElement(model, { ...options, mode: 'full', furnitureVisible: true }, meshes),
  );
  assert.equal(renderer.scene.findByProps({ name: 'cutCaps' }).instance.visible, false);
  await renderer.update(sceneElement(model, { ...options, mode: 'cut' }, meshes));
  assert.ok(caps().every((node) => node.instance.visible));
  assert.equal(renderer.scene.findByProps({ name: 'cutCaps' }).instance.visible, true);
});

test('mount and remount dispose each resource once and allocate fresh resources', async () => {
  const originalGeometryDispose = THREE.BufferGeometry.prototype.dispose;
  const originalMaterialDispose = THREE.Material.prototype.dispose;
  const geometries = new Map<THREE.BufferGeometry, number>();
  const materials = new Map<THREE.Material, number>();
  THREE.BufferGeometry.prototype.dispose = function () {
    geometries.set(this, (geometries.get(this) ?? 0) + 1);
    originalGeometryDispose.call(this);
  };
  THREE.Material.prototype.dispose = function () {
    materials.set(this, (materials.get(this) ?? 0) + 1);
    originalMaterialDispose.call(this);
  };
  try {
    const meshes: ApartmentMesh[] = [];
    const options = { ...DEFAULT_VIEWER_OPTIONS };
    for (let mount = 0; mount < 2; mount++) {
      const renderer = await ReactThreeTestRenderer.create(
        React.createElement(React.StrictMode, null, sceneElement(model, options, meshes)),
      );
      assert.equal(new Set(meshes.map((mesh) => mesh.geometry)).size, 3);
      assert.ok(meshes.every((mesh) => !geometries.has(mesh.geometry)));
      await renderer.unmount();
      assert.equal(meshes.filter(Boolean).length, 0);
    }
    assert.equal(geometries.size, 6);
    assert.equal(
      materials.size,
      2 * (model.parts.length + Object.keys(model.materials).length + 1),
    );
    assert.ok([...geometries.values(), ...materials.values()].every((count) => count === 1));
  } finally {
    THREE.BufferGeometry.prototype.dispose = originalGeometryDispose;
    THREE.Material.prototype.dispose = originalMaterialDispose;
  }
});

test('zoom preserves the world point under the cursor', async (t) => {
  const { renderer, controller, area } = await setup();
  t.after(() => renderer.unmount());
  controller.setMode('cut');
  controller.update();
  const anchor = new THREE.Vector3(0.3, -0.2, 0).unproject(controller.camera);
  const rect = area.getBoundingClientRect();
  for (const factor of [1.15, 1.15, 0.8, 1.4])
    controller.zoomAt(factor, rect.left + rect.width * 0.65, rect.top + rect.height * 0.6);
  controller.update();
  const projected = anchor.project(controller.camera);
  assert.ok(Math.abs(projected.x - 0.3) < 1e-9);
  assert.ok(Math.abs(projected.y + 0.2) < 1e-9);
});
