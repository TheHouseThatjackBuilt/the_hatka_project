import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { buildApartment } from '../../../src/modeling/build-apartment.ts';
import { ApartmentScene } from '../../../src/viewer/ApartmentScene.tsx';
import { DEFAULT_VIEWER_OPTIONS } from '../../../src/viewer/options.ts';
import { DEFAULT_FLOOR_SELECTION } from '../../../src/viewer/flooring-options.ts';
import type { ApartmentMesh } from '../../../src/viewer/types.ts';

// Diagnostic camera only: geometry and materials are the production ApartmentScene.
function Detail() {
  const model = useMemo(() => buildApartment(), []);
  const meshes = useMemo<ApartmentMesh[]>(() => [], []);
  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [2.535, 1.5, 7.65], fov: 65, near: 0.02, far: 50 }}
      gl={{ antialias: true, localClippingEnabled: true }}
      onCreated={({ gl, camera }) => {
        camera.lookAt(2.535, 1.5, 3.171);
        camera.updateMatrixWorld();
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <ApartmentScene
        model={model}
        meshes={meshes}
        options={{ ...DEFAULT_VIEWER_OPTIONS, mode: 'full', flooring: DEFAULT_FLOOR_SELECTION }}
      />
    </Canvas>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Detail />
  </StrictMode>,
);
