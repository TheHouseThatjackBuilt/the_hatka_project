import * as THREE from 'three';
import type { ApartmentModel, ModelPart } from '../model/types.ts';
import {
  FLOOR_COMPARISON_FORMATS,
  isFloorSelection,
  type FloorSelection,
} from './flooring-options.ts';

const TEXTURE_URL = new URL('../assets/floor/wood-effect-porcelain-preview.png', import.meta.url)
  .href;

/** User-approved trial settings. The origin and tone are visual comparison choices. */
export const FLOOR_PREVIEW_LAYOUT = {
  rowOffset: 1 / 3,
  groutWidth: 0.002,
  groutColor: '#8d7961',
  origin: [0, 0] as const,
};

export function coveredFloorSurfaces(model: ApartmentModel) {
  const covering = model.flooring?.coverings.find(
    (item) => item.kind === 'porcelain-stoneware' && item.appearance === 'wood-effect',
  );
  return new Set(
    model.flooring?.surfaces
      .filter((surface) => covering && surface.coveringId === covering.id)
      .map((surface) => surface.id),
  );
}

export function isCoveredFloor(part: ModelPart, surfaces: Set<string>) {
  return part.group === 'floor' && !!part.floorSurfaceId && surfaces.has(part.floorSurfaceId);
}

export function isLegacyFloorJoint(part: ModelPart) {
  return part.mat === 'joint' || part.mat === 'tilejoint';
}

const fragmentHeader = `
varying vec3 vFloorWorld;
varying float vFloorTop;
uniform sampler2D floorTexture;
uniform float floorTextureReady;
uniform vec2 floorSize;
uniform float floorDirection;
uniform vec3 floorGroutColor;
uniform vec2 floorOrigin;
uniform float floorGroutWidth;
uniform float floorRowOffset;
vec2 floorHash(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
`;
const fragmentPattern = `
if (vFloorTop > 0.5) {
  vec2 world = vFloorWorld.xz - floorOrigin;
  vec2 axes = floorDirection < 0.5 ? world : world.yx;
  vec2 pitch = floorSize + vec2(floorGroutWidth);
  float row = floor(axes.y / pitch.y);
  float along = axes.x - row * floorRowOffset * floorSize.x;
  float column = floor(along / pitch.x);
  vec2 local = vec2(along - column * pitch.x, axes.y - row * pitch.y);
  vec2 random = floorHash(vec2(column, row));
  // Fixed physical grain scale: a 60 cm tile samples half the length of a 120 cm tile.
  vec2 woodUv = vec2(local.y / 0.6, local.x / 1.2) + random;
  vec3 wood = vec3(0.42, 0.26, 0.14);
  if (floorTextureReady > 0.5) wood = texture2D(floorTexture, woodUv).rgb;
  wood *= 0.88 + 0.18 * random.x;
  float edge = min(min(local.x, floorSize.x - local.x), min(local.y, floorSize.y - local.y));
  float aa = max(max(fwidth(axes.x), fwidth(axes.y)), 0.0001);
  float tile = smoothstep(-aa, aa, edge);
  diffuseColor.rgb = mix(floorGroutColor, wood, tile);
}
`;

/** Owned by the scene hook; borrowed by floor meshes via primitive material attachment. */
export function createFloorPreviewResources(
  invalidate: () => void,
  onError: (error: unknown) => void,
  loader = new THREE.TextureLoader(),
) {
  let active = true;
  const uniforms = {
    floorTexture: { value: null as THREE.Texture | null },
    floorTextureReady: { value: 0 },
    floorSize: { value: new THREE.Vector2(1.2, 0.2) },
    floorDirection: { value: 1 },
    floorGroutColor: { value: new THREE.Color(FLOOR_PREVIEW_LAYOUT.groutColor) },
    floorOrigin: { value: new THREE.Vector2(...FLOOR_PREVIEW_LAYOUT.origin) },
    floorGroutWidth: { value: FLOOR_PREVIEW_LAYOUT.groutWidth },
    floorRowOffset: { value: FLOOR_PREVIEW_LAYOUT.rowOffset },
  };
  const material = new THREE.MeshStandardMaterial({
    name: 'Керамогранит под дерево · пробное покрытие',
    color: '#ad8b69',
    roughness: 0.85,
    metalness: 0,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      'varying vec3 vFloorWorld; varying float vFloorTop;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvFloorWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvFloorTop = normal.y;',
    );
    shader.fragmentShader = fragmentHeader + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      '#include <map_fragment>\n' + fragmentPattern,
    );
  };
  material.customProgramCacheKey = () => 'hatka-floor-preview-v1';
  let texture: THREE.Texture;
  try {
    texture = loader.load(
      TEXTURE_URL,
      (loaded) => {
        if (!active) return;
        uniforms.floorTexture.value = loaded;
        uniforms.floorTextureReady.value = 1;
        invalidate();
      },
      undefined,
      (error) => {
        if (active) onError(error);
      },
    );
  } catch (error) {
    active = false;
    material.dispose();
    throw error;
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  uniforms.floorTexture.value = texture;
  return {
    material,
    texture,
    uniforms,
    setSelection(selection: FloorSelection) {
      if (!isFloorSelection(selection)) return;
      const format = FLOOR_COMPARISON_FORMATS.find((item) => item.id === selection.formatId)!;
      uniforms.floorSize.value.set(format.length, format.width);
      uniforms.floorDirection.value = selection.direction === 'x' ? 0 : 1;
    },
    dispose() {
      if (!active) return;
      active = false;
      texture.dispose();
      material.dispose();
    },
  };
}

export type FloorPreviewResources = ReturnType<typeof createFloorPreviewResources>;
