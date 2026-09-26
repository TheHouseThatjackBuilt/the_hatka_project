import { useLayoutEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { ApartmentMesh } from './types.ts';

const RESOLUTION = 512;
const vertexShader = `varying float worldY;
void main() {
  vec4 p = modelMatrix * vec4(position, 1.0);
  worldY = p.y;
  gl_Position = projectionMatrix * viewMatrix * p;
}`;
const fragmentShader = `uniform float receiverY; varying float worldY;
void main() {
  float alpha = 1.0 - smoothstep(receiverY, receiverY + 0.3, worldY);
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}`;
const blurVertex = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const blurFragment = `uniform sampler2D map; uniform vec2 direction; varying vec2 vUv;
void main() {
  vec4 c = texture2D(map, vUv) * 0.227027;
  for (int i = 1; i < 5; i++) {
    float w = i == 1 ? 0.1945946 : (i == 2 ? 0.1216216 : (i == 3 ? 0.054054 : 0.0162161));
    c += (texture2D(map, vUv + direction * float(i)) + texture2D(map, vUv - direction * float(i))) * w;
  }
  gl_FragColor = c;
}`;

function isVisible(mesh: THREE.Object3D) {
  for (let node: THREE.Object3D | null = mesh; node; node = node.parent)
    if (!node.visible) return false;
  return true;
}

/** Borrowed geometries stay owned by the main scene. Bounds come from existing floor finishes. */
export function contactShadowLayout(meshes: ApartmentMesh[]) {
  const floors = meshes.filter((mesh) => mesh.userData.group === 'floor' && isVisible(mesh));
  const casters = meshes.filter(
    (mesh) => mesh.userData.group === 'furniture' && isVisible(mesh) && mesh.material.opacity === 1,
  );
  if (!floors.length || !casters.length) return null;
  const bounds = new THREE.Box3();
  floors.forEach((mesh) => bounds.expandByObject(mesh));
  const center = bounds.getCenter(new THREE.Vector3());
  return {
    casters,
    center,
    y: bounds.max.y + 0.001,
    width: bounds.max.x - bounds.min.x,
    depth: bounds.max.z - bounds.min.z,
  };
}

export function ContactShadows({
  meshes,
  revision,
}: {
  meshes: ApartmentMesh[];
  revision: string;
}) {
  const { gl } = useThree();
  const [baked, setBaked] = useState<{
    texture: THREE.Texture;
    layout: NonNullable<ReturnType<typeof contactShadowLayout>>;
    revision: string;
  } | null>(null);
  useLayoutEffect(() => {
    const layout = contactShadowLayout(meshes);
    if (!layout) {
      setBaked(null);
      return;
    }
    const a = new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION);
    const b = new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION, { depthBuffer: false });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -layout.width / 2,
      layout.width / 2,
      layout.depth / 2,
      -layout.depth / 2,
      0.01,
      10,
    );
    camera.position.set(layout.center.x, layout.y - 4, layout.center.z);
    camera.up.set(0, 0, 1);
    camera.lookAt(layout.center.x, layout.y, layout.center.z);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { receiverY: { value: layout.y } },
      side: THREE.DoubleSide,
      blending: THREE.NoBlending,
    });
    for (const source of layout.casters) {
      source.updateWorldMatrix(true, false);
      const copy = new THREE.Mesh(source.geometry, material);
      copy.matrixAutoUpdate = false;
      copy.matrix.copy(source.matrixWorld);
      scene.add(copy);
    }
    const quadScene = new THREE.Scene();
    const quadCamera = new THREE.Camera();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const blurMaterial = new THREE.ShaderMaterial({
      vertexShader: blurVertex,
      fragmentShader: blurFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        map: { value: a.texture },
        direction: { value: new THREE.Vector2(1 / RESOLUTION, 0) },
      },
    });
    quadScene.add(new THREE.Mesh(geometry, blurMaterial));
    const disposeTemporary = () => {
      b.dispose();
      material.dispose();
      blurMaterial.dispose();
      geometry.dispose();
      scene.clear();
      quadScene.clear();
    };
    const previous = {
      target: gl.getRenderTarget(),
      color: gl.getClearColor(new THREE.Color()),
      alpha: gl.getClearAlpha(),
      autoClear: gl.autoClear,
      shadow: gl.shadowMap.enabled,
    };
    try {
      gl.setRenderTarget(a);
      gl.setClearColor(0, 0);
      gl.autoClear = true;
      gl.shadowMap.enabled = false;
      gl.render(scene, camera);
      gl.setRenderTarget(b);
      gl.render(quadScene, quadCamera);
      blurMaterial.uniforms.map!.value = b.texture;
      blurMaterial.uniforms.direction!.value.set(0, 1 / RESOLUTION);
      gl.setRenderTarget(a);
      gl.render(quadScene, quadCamera);
      // The upward bake camera's +Z screen axis opposes the horizontal plane's UV axis.
      a.texture.repeat.y = -1;
      a.texture.offset.y = 1;
      setBaked({ texture: a.texture, layout, revision });
    } catch (error) {
      a.dispose();
      throw error;
    } finally {
      gl.setRenderTarget(previous.target);
      gl.setClearColor(previous.color, previous.alpha);
      gl.autoClear = previous.autoClear;
      gl.shadowMap.enabled = previous.shadow;
      disposeTemporary();
    }
    return () => a.dispose();
  }, [gl, meshes, revision]);
  if (!baked || baked.revision !== revision) return null;
  const { layout } = baked;
  return (
    <mesh
      name="contact-shadows"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[layout.center.x, layout.y, layout.center.z]}
    >
      <planeGeometry args={[layout.width, layout.depth]} />
      <meshBasicMaterial
        map={baked.texture}
        color="black"
        transparent
        opacity={0.28}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
