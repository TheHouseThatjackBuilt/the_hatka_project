import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Supplies a small studio reflection environment while the viewer is mounted. */
export function StudioEnvironment() {
  const { scene, gl, invalidate } = useThree();

  useLayoutEffect(() => {
    const previousEnvironment = scene.environment;
    let generator: THREE.PMREMGenerator | undefined;
    let room: RoomEnvironment | undefined;
    let renderTarget: THREE.WebGLRenderTarget | undefined;
    const previousRenderer = {
      target: gl.getRenderTarget(),
      toneMapping: gl.toneMapping,
      autoClear: gl.autoClear,
      color: gl.getClearColor(new THREE.Color()),
      alpha: gl.getClearAlpha(),
    };

    try {
      generator = new THREE.PMREMGenerator(gl);
      room = new RoomEnvironment();
      renderTarget = generator.fromScene(room, 0.04);
      scene.environment = renderTarget.texture;
      invalidate();
    } catch (error) {
      scene.environment = previousEnvironment;
      renderTarget?.dispose();
      invalidate();
      throw error;
    } finally {
      generator?.dispose();
      room?.dispose();
      gl.setRenderTarget(previousRenderer.target);
      gl.toneMapping = previousRenderer.toneMapping;
      gl.autoClear = previousRenderer.autoClear;
      gl.setClearColor(previousRenderer.color, previousRenderer.alpha);
    }

    return () => {
      scene.environment = previousEnvironment;
      renderTarget?.dispose();
      invalidate();
    };
  }, [gl, invalidate, scene]);

  return null;
}
