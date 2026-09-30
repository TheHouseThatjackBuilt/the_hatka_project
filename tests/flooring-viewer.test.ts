import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { buildApartment } from '../src/modeling/build-apartment.ts';
import { ApartmentScene } from '../src/viewer/ApartmentScene.tsx';
import { pickMeasurementSurface } from '../src/viewer/measurement-picking.ts';
import { createFloorPreviewResources } from '../src/viewer/flooring-material.ts';
import {
  DEFAULT_FLOOR_SELECTION,
  FLOOR_SELECTION_STORAGE_KEY,
  readFloorSelection,
  writeFloorSelection,
} from '../src/viewer/flooring-options.ts';
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

test('floor comparison persists valid choices and tolerates malformed or blocked storage', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
  assert.deepEqual(readFloorSelection(storage), DEFAULT_FLOOR_SELECTION);
  const choice = { formatId: '20x60', direction: 'x' as const };
  writeFloorSelection(storage, choice);
  assert.deepEqual(readFloorSelection(storage), choice);
  for (const value of [
    '{',
    'null',
    '{}',
    '{"formatId":"40x80","direction":"x"}',
    '{"formatId":"20x60","direction":"y"}',
  ]) {
    values.set(FLOOR_SELECTION_STORAGE_KEY, value);
    assert.deepEqual(readFloorSelection(storage), DEFAULT_FLOOR_SELECTION);
  }
  const blocked = () => {
    throw new Error('storage denied');
  };
  assert.deepEqual(readFloorSelection({ getItem: blocked }), DEFAULT_FLOOR_SELECTION);
  assert.doesNotThrow(() => writeFloorSelection({ setItem: blocked }, choice));
});

test('switching floor reuses its resources; cleanup suppresses late loader callbacks', () => {
  let ready: ((texture: THREE.Texture) => void) | undefined;
  let fail: ((error: unknown) => void) | undefined;
  let frames = 0;
  let errors = 0;
  const texture = new THREE.Texture();
  const loader = {
    load: (_url: string, onLoad: typeof ready, _progress: unknown, onError: typeof fail) => {
      ready = onLoad;
      fail = onError;
      return texture;
    },
  } as THREE.TextureLoader;
  const resources = createFloorPreviewResources(
    () => frames++,
    () => errors++,
    loader,
  );
  const material = resources.material;
  let materialDisposals = 0;
  let textureDisposals = 0;
  material.addEventListener('dispose', () => materialDisposals++);
  texture.addEventListener('dispose', () => textureDisposals++);
  ready!(texture);
  assert.equal(frames, 1);
  assert.equal(resources.uniforms.floorTextureReady.value, 1);
  resources.setSelection({ formatId: '20x60', direction: 'x' });
  assert.deepEqual(resources.uniforms.floorSize.value.toArray(), [0.6, 0.2]);
  assert.equal(resources.uniforms.floorDirection.value, 0);
  assert.equal(resources.material, material);
  assert.equal(resources.texture, texture);
  fail!(new Error('load failed'));
  assert.equal(errors, 1);
  resources.dispose();
  resources.dispose();
  ready!(texture);
  fail!(new Error('late failure'));
  assert.equal(frames, 1);
  assert.equal(errors, 1);
  assert.equal(materialDisposals, 1);
  assert.equal(textureDisposals, 1);
});

test('synchronous loader failure frees the material before propagating the error', (t) => {
  let disposals = 0;
  const original = THREE.Material.prototype.dispose;
  t.mock.method(THREE.Material.prototype, 'dispose', function (this: THREE.Material) {
    disposals++;
    original.call(this);
  });
  const error = new Error('loader unavailable');
  const loader = {
    load: () => {
      throw error;
    },
  } as unknown as THREE.TextureLoader;
  assert.throws(
    () =>
      createFloorPreviewResources(
        () => {},
        () => {},
        loader,
      ),
    (value) => value === error,
  );
  assert.equal(disposals, 1);
});

test('floor preview respects surface assignments, picking and mesh identity across modes and remounts', async (t) => {
  const textures: THREE.Texture[] = [];
  const disposeCounts: number[] = [];
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => {
    const index = textures.length;
    const texture = new THREE.Texture();
    textures.push(texture);
    disposeCounts.push(0);
    texture.addEventListener('dispose', () => (disposeCounts[index] = disposeCounts[index]! + 1));
    return texture;
  });
  const model = buildApartment();
  const meshes: ApartmentMesh[] = [];
  const options: ViewerOptions = {
    ...DEFAULT_VIEWER_OPTIONS,
    flooring: { ...DEFAULT_FLOOR_SELECTION },
  };
  const element = () => React.createElement(ApartmentScene, { model, options, meshes });
  const renderer = await ReactThreeTestRenderer.create(element());
  t.after(() => renderer.unmount());
  const originalMeshes = [...meshes];
  const geometries = meshes.map((mesh) => mesh.geometry);
  const floor = meshes.find(
    (mesh) => mesh.userData.floorSurfaceId === 'apartment-main' && mesh.userData.mat !== 'joint',
  )!;
  const previewMaterial = floor.material;
  let materialDisposals = 0;
  previewMaterial.addEventListener('dispose', () => materialDisposals++);
  const assigned = new Set(['apartment-main', 'main-bathroom', 'entrance-inlay']);
  meshes.forEach((mesh) => {
    const part = mesh.userData;
    const covered = part.group === 'floor' && assigned.has(part.floorSurfaceId ?? '');
    const joint = part.mat === 'joint' || part.mat === 'tilejoint';
    if (covered && joint) assert.equal(mesh.visible, false);
    else if (covered) assert.equal(mesh.material, previewMaterial);
    else assert.notEqual(mesh.material, previewMaterial);
    assert.deepEqual(mesh.position.toArray(), part.pos);
    assert.deepEqual(mesh.scale.toArray(), part.size);
  });
  const joint = meshes.find(
    (mesh) => assigned.has(mesh.userData.floorSurfaceId ?? '') && !mesh.visible,
  )!;
  const camera = new THREE.PerspectiveCamera();
  camera.position.copy(joint.position).add(new THREE.Vector3(0, 5, 0));
  camera.up.set(0, 0, -1);
  camera.lookAt(joint.position);
  camera.updateMatrixWorld();
  assert.equal(
    pickMeasurementSurface(
      camera,
      new THREE.Vector2(),
      [{ mesh: joint, part: joint.userData }],
      'top',
    ),
    null,
  );
  for (const mode of ['cut', 'full', 'top'] as const) {
    options.mode = mode;
    options.flooring = { formatId: '20x60', direction: 'x' };
    await renderer.update(element());
    meshes.forEach((mesh, index) => {
      assert.equal(mesh, originalMeshes[index]);
      assert.equal(mesh.geometry, geometries[index]);
    });
    assert.equal(floor.material, previewMaterial);
    assert.equal(textures.length, 1);
  }
  options.flooring = undefined;
  await renderer.update(element());
  assert.equal(joint.visible, true);
  assert.notEqual(floor.material, previewMaterial);
  assert.equal(materialDisposals, 1);
  assert.deepEqual(disposeCounts, [1]);
  options.flooring = { ...DEFAULT_FLOOR_SELECTION };
  await renderer.update(element());
  assert.notEqual(floor.material, previewMaterial);
  assert.equal(joint.visible, false);
  await renderer.unmount();
  assert.deepEqual(disposeCounts, [1, 1]);
  const remountedMeshes: ApartmentMesh[] = [];
  const remounted = await ReactThreeTestRenderer.create(
    React.createElement(ApartmentScene, { model, options, meshes: remountedMeshes }),
  );
  assert.notEqual(remountedMeshes[0]?.geometry, geometries[0]);
  assert.equal(textures.length, 3);
  await remounted.unmount();
  assert.deepEqual(disposeCounts, [1, 1, 1]);
});
