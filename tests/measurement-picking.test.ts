import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Mesh, MeshBasicMaterial, Group, OrthographicCamera, Vector2 } from 'three';
import { pickMeasurementSurface } from '../src/viewer/measurement-picking.ts';
import type { ModelPart } from '../src/model/types.ts';

test('picking follows parent visibility and maps a cut cap to the original wall', () => {
  const geometry = new BoxGeometry(1, 1, 1),
    material = new MeshBasicMaterial();
  const part: ModelPart = {
    name: 'wall',
    shape: 'box',
    pos: [0, 1.35, 0],
    size: [2, 2.7, 1],
    rot: 0,
    mat: 'wall',
    group: 'walls',
    measurementId: 'wall',
  };
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...part.pos);
  mesh.scale.set(...part.size);
  const cap = new Mesh(geometry, material);
  cap.position.y = 1.048;
  cap.scale.set(2, 0.008, 1);
  const group = new Group();
  group.add(mesh, cap);
  group.updateMatrixWorld(true);
  const camera = new OrthographicCamera(-2, 2, 2, -2, 0.1, 20);
  camera.position.set(0, 8, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const surfaces = [
    { mesh, part },
    { mesh: cap, part, cutCap: true },
  ];
  try {
    const cut = pickMeasurementSurface(camera, new Vector2(), surfaces, 'cut');
    assert.equal(cut?.part.measurementId, 'wall');
    assert.equal(cut?.point.y, 1.05);
    assert.equal(pickMeasurementSurface(camera, new Vector2(), surfaces, 'full')?.point.y, 2.7);
    group.visible = false;
    assert.equal(pickMeasurementSurface(camera, new Vector2(), surfaces, 'cut'), null);
    group.visible = true;
    mesh.visible = false;
    cap.visible = false;
    assert.equal(pickMeasurementSurface(camera, new Vector2(), surfaces, 'full'), null);
  } finally {
    geometry.dispose();
    material.dispose();
  }
});
