import { addAfterEffect, type RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

/** Diagnostic only. Per-material normals preserve local cut planes; alpha stays untouched. */
export function attachAO(state: RootState): () => void {
  const { gl, scene, camera } = state;
  const pass = new SSAOPass(scene, camera, gl.domElement.width, gl.domElement.height, 16);
  const normals = new Map<THREE.Material, THREE.MeshNormalMaterial>();
  pass.ssaoMaterial.defines.PERSPECTIVE_CAMERA = 0;
  pass.kernelRadius = 0.25;
  pass.minDistance = 0.0001;
  pass.maxDistance = 0.005;
  let previousFrame = -1;
  const remove = addAfterEffect(() => {
    if (gl.info.render.frame === previousFrame) return;
    const width = gl.domElement.width,
      height = gl.domElement.height;
    if (pass.width !== width || pass.height !== height) pass.setSize(width, height);
    pass.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
    pass.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(
      camera.projectionMatrixInverse,
    );
    pass.ssaoMaterial.uniforms.cameraNear.value = camera.near;
    pass.ssaoMaterial.uniforms.cameraFar.value = camera.far;
    const prior = {
      target: gl.getRenderTarget(),
      color: gl.getClearColor(new THREE.Color()),
      alpha: gl.getClearAlpha(),
      autoClear: gl.autoClear,
      shadows: gl.shadowMap.enabled,
      override: scene.overrideMaterial,
    };
    const changed: { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }[] = [];
    const hidden: THREE.Object3D[] = [];
    try {
      scene.overrideMaterial = null;
      scene.traverse((object) => {
        if (!object.visible) return;
        if (object instanceof THREE.LineSegments || object instanceof THREE.Points) {
          hidden.push(object);
          object.visible = false;
        }
        if (!(object instanceof THREE.Mesh)) return;
        if (Array.isArray(object.material) || object.material.transparent) {
          hidden.push(object);
          object.visible = false;
          return;
        }
        const source = object.material;
        let normal = normals.get(source);
        if (!normal) {
          normal = new THREE.MeshNormalMaterial({ side: source.side });
          normals.set(source, normal);
        }
        if ((normal.clippingPlanes?.length ?? 0) !== (source.clippingPlanes?.length ?? 0))
          normal.needsUpdate = true;
        normal.clippingPlanes = source.clippingPlanes;
        changed.push({ mesh: object, material: source });
        object.material = normal;
      });
      gl.shadowMap.enabled = false;
      gl.autoClear = true;
      gl.setRenderTarget(pass.normalRenderTarget);
      gl.setClearColor(0x7777ff, 1);
      gl.render(scene, camera);
      pass.ssaoMaterial.uniforms.kernelRadius.value = pass.kernelRadius;
      pass.ssaoMaterial.uniforms.minDistance.value = pass.minDistance;
      pass.ssaoMaterial.uniforms.maxDistance.value = pass.maxDistance;
      pass.renderPass(gl, pass.ssaoMaterial, pass.ssaoRenderTarget);
      pass.renderPass(gl, pass.blurMaterial, pass.blurRenderTarget);
      pass.copyMaterial.uniforms.tDiffuse.value = pass.blurRenderTarget.texture;
      pass.copyMaterial.blending = THREE.CustomBlending;
      pass.copyMaterial.blendSrc = THREE.DstColorFactor;
      pass.copyMaterial.blendDst = THREE.ZeroFactor;
      pass.copyMaterial.blendSrcAlpha = THREE.ZeroFactor;
      pass.copyMaterial.blendDstAlpha = THREE.OneFactor;
      pass.renderPass(gl, pass.copyMaterial, null);
    } finally {
      changed.forEach(({ mesh, material }) => {
        mesh.material = material;
      });
      hidden.forEach((object) => {
        object.visible = true;
      });
      scene.overrideMaterial = prior.override;
      gl.setRenderTarget(prior.target);
      gl.setClearColor(prior.color, prior.alpha);
      gl.autoClear = prior.autoClear;
      gl.shadowMap.enabled = prior.shadows;
      previousFrame = gl.info.render.frame;
    }
  });
  state.invalidate();
  return () => {
    remove();
    pass.dispose();
    normals.forEach((material) => material.dispose());
    state.invalidate();
  };
}
