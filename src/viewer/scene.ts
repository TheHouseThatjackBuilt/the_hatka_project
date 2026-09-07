import * as THREE from 'three';
import type { ApartmentModel, ModelGroup, ModelPart } from '../model/types.ts';
import type { ApartmentMesh, ViewMode } from './types.ts';

export const CUT_HEIGHT = 1.05;
const CLIPPED_GROUPS = new Set(['walls', 'windows', 'doors', 'furniture']);

export function isClipped(part: ModelPart, mode: ViewMode) {
  return mode !== 'full' && CLIPPED_GROUPS.has(part.group);
}

export function createApartmentScene(model: ApartmentModel) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa7a099, 1.7));
  const sunlight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunlight.position.set(-4, 14, -5);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, {
    left: -11,
    right: 11,
    top: 11,
    bottom: -11,
    near: 0.5,
    far: 45,
  });
  sunlight.shadow.bias = -0.00025;
  sunlight.shadow.normalBias = 0.025;
  sunlight.target.position.set(5, 0, 4);
  scene.add(sunlight, sunlight.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(12, 8, 12);
  scene.add(fill);

  const materials: Record<string, THREE.MeshStandardMaterial> = {};
  for (const [key, [name, color, opacity]] of Object.entries(model.materials)) {
    materials[key] = new THREE.MeshStandardMaterial({
      name,
      color,
      opacity,
      roughness: ['glass', 'mirror', 'black'].includes(key) ? 0.23 : 0.85,
      metalness: key === 'dark' ? 0.22 : 0,
      transparent: opacity < 1,
      depthWrite: opacity === 1,
      side: opacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
    });
  }
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 24),
    sphere: new THREE.SphereGeometry(0.5, 20, 12),
  };
  const groups: Partial<Record<ModelGroup, THREE.Group>> = {};
  const meshes: ApartmentMesh[] = [];
  const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT_HEIGHT);

  function getMaterial(id: string) {
    const material = materials[id];
    if (!material) throw new Error(`Unknown model material: ${id}`);
    return material;
  }

  for (const part of model.parts) {
    let group = groups[part.group];
    if (!group) {
      group = new THREE.Group();
      group.name = part.group;
      groups[part.group] = group;
      scene.add(group);
    }
    const mesh = Object.assign(
      new THREE.Mesh(geometries[part.shape], getMaterial(part.mat).clone()),
      {
        userData: part,
      },
    );
    mesh.material.clipShadows = true;
    mesh.name = part.name;
    mesh.position.set(...part.pos);
    mesh.rotation.y = part.rot;
    mesh.scale.set(...part.size);
    mesh.castShadow = part.group !== 'floor' && !['glass', 'showerglass'].includes(part.mat);
    mesh.receiveShadow = true;
    group.add(mesh);
    meshes.push(mesh);
  }
  if (groups.ceiling) groups.ceiling.visible = false;

  // Fill the open surfaces left by clipping tall box-shaped objects.
  const cutCaps = new THREE.Group();
  const capMaterial = new THREE.MeshStandardMaterial({ color: 0x9a958b, roughness: 1 });
  scene.add(cutCaps);
  for (const part of model.parts) {
    if (part.shape !== 'box' || !['walls', 'furniture'].includes(part.group)) continue;
    const bottom = part.pos[1] - part.size[1] / 2;
    const top = part.pos[1] + part.size[1] / 2;
    if (bottom >= CUT_HEIGHT || top <= CUT_HEIGHT) continue;
    const cap = new THREE.Mesh(
      geometries.box,
      part.group === 'walls' ? capMaterial : getMaterial(part.mat),
    );
    cap.position.set(part.pos[0], CUT_HEIGHT - 0.002, part.pos[2]);
    cap.scale.set(part.size[0], 0.008, part.size[2]);
    cap.rotation.y = part.rot;
    cap.userData.group = part.group;
    cutCaps.add(cap);
  }

  function setMode(mode: ViewMode) {
    for (const mesh of meshes) {
      const part = mesh.userData;
      const cut = isClipped(part, mode);
      mesh.material.clippingPlanes = cut ? [clippingPlane] : [];
      // Wall-hung furniture remains in the full model but is hidden in cutaway views.
      mesh.visible = !(
        cut &&
        part.group === 'furniture' &&
        part.pos[1] - part.size[1] / 2 > CUT_HEIGHT - 0.01
      );
    }
    cutCaps.visible = mode !== 'full';
  }

  function setFurnitureVisible(visible: boolean) {
    if (groups.furniture) groups.furniture.visible = visible;
    for (const cap of cutCaps.children) {
      if (cap.userData.group === 'furniture') cap.visible = visible;
    }
  }

  function dispose() {
    for (const geometry of Object.values(geometries)) geometry.dispose();
    for (const material of Object.values(materials)) material.dispose();
    for (const mesh of meshes) mesh.material.dispose();
    capMaterial.dispose();
    sunlight.shadow.dispose();
    scene.clear();
  }

  return { scene, meshes, setMode, setFurnitureVisible, dispose };
}
