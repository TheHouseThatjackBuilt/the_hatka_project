import { useLayoutEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import type { ApartmentModel, ModelPart } from '../model/types.ts';
import type { ApartmentMesh, ViewerOptions } from './types.ts';
import {
  CUT_HEIGHT,
  createSceneResources,
  isClipped,
  type SceneResources,
} from './scene-resources.ts';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface Props {
  model: ApartmentModel;
  options: ViewerOptions;
  meshes: ApartmentMesh[];
  caps?: THREE.Mesh[];
  children?: ReactNode;
}

function PartMesh({
  part,
  originalIndex,
  options,
  meshes,
  resources,
}: {
  part: ModelPart;
  originalIndex: number;
  options: ViewerOptions;
  meshes: ApartmentMesh[];
  resources: SceneResources;
}) {
  const register = useCallback(
    (meshRef: ApartmentMesh | null) => {
      if (meshRef) meshes[originalIndex] = meshRef;
      else delete meshes[originalIndex];
    },
    [meshes, originalIndex],
  );
  const material = resources.materials[part.mat];
  if (!material) throw new Error(`Unknown model material: ${part.mat}`);
  const clipped = isClipped(part, options.mode);
  const hiddenWallFurniture =
    clipped && part.group === 'furniture' && part.pos[1] - part.size[1] / 2 > CUT_HEIGHT - 0.01;
  return (
    <mesh
      ref={register}
      userData={part}
      name={part.name}
      position={part.pos}
      rotation={[0, part.rot, 0]}
      scale={part.size}
      castShadow={part.group !== 'floor' && !['glass', 'showerglass'].includes(part.mat)}
      receiveShadow
      visible={!hiddenWallFurniture}
      geometry={resources.geometries[part.shape]}
    >
      <meshStandardMaterial
        name={material.name}
        color={material.color}
        opacity={material.opacity}
        roughness={material.roughness}
        metalness={material.metalness}
        transparent={material.transparent}
        depthWrite={material.depthWrite}
        side={material.side}
        clipShadows
        clippingPlanes={clipped ? [resources.clippingPlane] : []}
      />
    </mesh>
  );
}

export function ApartmentScene({ model, options, meshes, caps, children }: Props) {
  const [allocated, setAllocated] = useState<{
    model: ApartmentModel;
    resources: SceneResources;
  } | null>(null);
  useLayoutEffect(() => {
    const resources = createSceneResources(model);
    setAllocated({ model, resources });
    return () => resources.dispose();
  }, [model]);
  const sunlightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (sunlightRef.current && targetRef.current) sunlightRef.current.target = targetRef.current;
  }, [allocated?.resources]);
  if (!allocated || allocated.model !== model) return null;
  const { resources } = allocated;
  const groups = new Map<string, number[]>();
  model.parts.forEach((part, index) => {
    const indices = groups.get(part.group) ?? [];
    indices.push(index);
    groups.set(part.group, indices);
  });
  return (
    <>
      <hemisphereLight args={[0xffffff, 0xa7a099, 1.7]} />
      <directionalLight
        ref={sunlightRef}
        position={[-4, 14, -5]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-bias={-0.00025}
        shadow-normalBias={0.025}
      />
      <group ref={targetRef} position={[5, 0, 4]} />
      <directionalLight position={[12, 8, 12]} intensity={0.5} />
      {Array.from(groups, ([groupName, indices]) => (
        <group
          key={groupName}
          name={groupName}
          visible={
            groupName !== 'ceiling' && (groupName !== 'furniture' || options.furnitureVisible)
          }
        >
          {indices.map((index) => (
            <PartMesh
              key={index}
              part={model.parts[index]!}
              originalIndex={index}
              options={options}
              meshes={meshes}
              resources={resources}
            />
          ))}
        </group>
      ))}
      <group name="cutCaps" visible={options.mode !== 'full'}>
        {model.parts.map((part, index) => {
          const bottom = part.pos[1] - part.size[1] / 2;
          const top = part.pos[1] + part.size[1] / 2;
          if (
            part.shape !== 'box' ||
            !['walls', 'furniture'].includes(part.group) ||
            bottom >= CUT_HEIGHT ||
            top <= CUT_HEIGHT
          )
            return null;
          const capMaterial =
            part.group === 'walls' ? resources.capMaterial : resources.materials[part.mat];
          if (!capMaterial) throw new Error(`Unknown model material: ${part.mat}`);
          return (
            <mesh
              key={index}
              ref={(mesh) => {
                if (!caps) return;
                if (mesh) caps[index] = mesh;
                else delete caps[index];
              }}
              geometry={resources.geometries.box}
              material={capMaterial}
              position={[part.pos[0], CUT_HEIGHT - 0.002, part.pos[2]]}
              rotation={[0, part.rot, 0]}
              scale={[part.size[0], 0.008, part.size[2]]}
              userData={{ group: part.group, sourceIndex: index }}
              visible={part.group !== 'furniture' || options.furnitureVisible}
            />
          );
        })}
      </group>
      {children}
    </>
  );
}
