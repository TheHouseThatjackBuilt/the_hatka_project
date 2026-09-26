import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { contactShadowLayout } from '../src/viewer/ContactShadows.tsx';
import type { ApartmentMesh } from '../src/viewer/types.ts';

test('contact receiver sits above floor finishes, not below the structural slab', () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial();
  const mesh = (group: 'floor' | 'furniture', y: number, height: number) => {
    const result: ApartmentMesh = Object.assign(new THREE.Mesh(geometry, material), {
      userData: {
        name: 'test',
        shape: 'box' as const,
        pos: [5, y, 4] as [number, number, number],
        size: [10, height, 8] as [number, number, number],
        rot: 0,
        mat: 'test',
        group,
      },
    });
    result.position.set(5, y, 4);
    result.scale.set(10, height, 8);
    return result;
  };
  const slab = mesh('floor', -0.09, 0.18);
  const finish = mesh('floor', 0.0125, 0.025);
  const furniture = mesh('furniture', 0.5, 1);
  const layout = contactShadowLayout([slab, finish, furniture])!;
  assert.ok(Math.abs(layout.y - 0.026) < 1e-9);
  assert.equal(layout.width, 10);
  assert.equal(layout.depth, 8);
  assert.equal(layout.center.x, 5);
  assert.equal(layout.center.z, 4);
  assert.deepEqual(layout.casters, [furniture]);
  const parent = new THREE.Group();
  parent.add(furniture);
  parent.visible = false;
  assert.equal(contactShadowLayout([slab, finish, furniture]), null);
  parent.visible = true;
  furniture.material.opacity = 0.3;
  assert.equal(contactShadowLayout([slab, finish, furniture]), null);
  geometry.dispose();
  material.dispose();
});
