import * as THREE from 'three';

const TEXTURE_SIZE = 128;

/**
 * Creates an approximate irregular water-relief height texture for door glass.
 * It does not model optical refraction; the caller owns and disposes the texture.
 */
export function createDoorGlassRelief(): THREE.DataTexture {
  const data = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4);
  const waves = [
    { u: 3, v: 5, phase: 0.2, weight: 0.34 },
    { u: 7, v: 2, phase: 1.4, weight: 0.2 },
    { u: 2, v: 11, phase: 2.7, weight: 0.16 },
    { u: 13, v: 3, phase: 4.1, weight: 0.12 },
    { u: 5, v: 17, phase: 5.3, weight: 0.1 },
    { u: 19, v: 7, phase: 0.9, weight: 0.08 },
  ];

  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    const v = y / TEXTURE_SIZE;
    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const u = x / TEXTURE_SIZE;
      let value = 0;

      for (const wave of waves) {
        const angle = Math.PI * 2 * (wave.u * u + wave.v * v) + wave.phase;
        value += wave.weight * Math.sin(angle);
        value += wave.weight * 0.35 * Math.cos(angle * 2 + wave.phase);
      }

      const normalized = Math.max(0, Math.min(255, Math.round(128 + value * 92)));
      const offset = (y * TEXTURE_SIZE + x) * 4;
      data[offset] = normalized;
      data[offset + 1] = normalized;
      data[offset + 2] = normalized;
      data[offset + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    TEXTURE_SIZE,
    TEXTURE_SIZE,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;

  return texture;
}
