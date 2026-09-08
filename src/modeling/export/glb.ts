import type { ApartmentModel, ModelGroup, ModelShape } from '../../model/types.ts';
import { primitiveGeometry } from './geometry.ts';

interface BufferView {
  buffer: number;
  byteOffset: number;
  byteLength: number;
  target: number;
}

interface Accessor {
  bufferView: number;
  componentType: number;
  count: number;
  type: 'VEC3' | 'SCALAR';
  min?: number[];
  max?: number[];
}

interface GltfNode {
  name: string;
  children?: number[];
  mesh?: number;
  translation?: number[];
  scale?: number[];
  rotation?: number[];
  extras?: { category: ModelGroup };
}

const GROUPS: ModelGroup[] = [
  'floor',
  'walls',
  'windows',
  'doors',
  'furniture',
  'balcony',
  'ceiling',
];
const align4 = (length: number) => Math.ceil(length / 4) * 4;

/** Serializes model data without a renderer, DOM, Node Buffer or filesystem. */
export function serializeGlb(model: ApartmentModel): Uint8Array<ArrayBuffer> {
  const chunks: { offset: number; bytes: Uint8Array<ArrayBuffer> }[] = [];
  let binaryLength = 0;
  const bufferViews: BufferView[] = [],
    accessors: Accessor[] = [];

  function accessor(
    values: number[],
    type: Accessor['type'],
    componentType: 5123 | 5126,
    target: number,
    bounds = false,
  ) {
    const bytesPerValue = componentType === 5126 ? 4 : 2;
    const buffer = new ArrayBuffer(values.length * bytesPerValue);
    const view = new DataView(buffer);
    values.forEach((value, index) => {
      if (componentType === 5126) view.setFloat32(index * 4, value, true);
      else view.setUint16(index * 2, value, true);
    });
    const offset = align4(binaryLength);
    chunks.push({ offset, bytes: new Uint8Array(buffer) });
    binaryLength = offset + buffer.byteLength;
    const result: Accessor = {
      bufferView: bufferViews.length,
      componentType,
      count: values.length / (type === 'VEC3' ? 3 : 1),
      type,
    };
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buffer.byteLength, target });
    if (bounds) {
      result.min = [0, 1, 2].map((axis) =>
        Math.min(...values.filter((_, index) => index % 3 === axis)),
      );
      result.max = [0, 1, 2].map((axis) =>
        Math.max(...values.filter((_, index) => index % 3 === axis)),
      );
    }
    accessors.push(result);
    return accessors.length - 1;
  }

  const primitives = new Map<ModelShape, [number, number, number]>();
  for (const shape of ['box', 'cylinder', 'sphere'] as const) {
    const geometry = primitiveGeometry(shape);
    primitives.set(shape, [
      accessor(geometry.positions, 'VEC3', 5126, 34962, true),
      accessor(geometry.normals, 'VEC3', 5126, 34962),
      accessor(geometry.indices, 'SCALAR', 5123, 34963),
    ]);
  }
  const materialIds = new Map<string, number>();
  const materials = Object.entries(model.materials).map(([key, [name, color, alpha]], index) => {
    materialIds.set(key, index);
    const rgb = [1, 3, 5]
      .map((i) => Number.parseInt(color.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return {
      name,
      pbrMetallicRoughness: {
        baseColorFactor: [...rgb, alpha],
        metallicFactor: key === 'dark' ? 0.25 : 0,
        roughnessFactor: ['glass', 'mirror', 'black'].includes(key) ? 0.18 : 0.8,
      },
      ...(alpha < 1 ? { alphaMode: 'BLEND', doubleSided: true } : {}),
    };
  });
  const meshes: {
    name: string;
    primitives: {
      attributes: { POSITION: number; NORMAL: number };
      indices: number;
      material: number;
    }[];
  }[] = [];
  const meshIds = new Map<string, number>();
  for (const part of model.parts) {
    const key = `${part.shape}/${part.mat}`;
    if (meshIds.has(key)) continue;
    const primitive = primitives.get(part.shape),
      material = materialIds.get(part.mat);
    if (!primitive || material === undefined) throw new Error(`Cannot export part: ${part.name}`);
    const [position, normal, indices] = primitive;
    meshIds.set(key, meshes.length);
    meshes.push({
      name: `${part.shape} / ${part.mat}`,
      primitives: [{ attributes: { POSITION: position, NORMAL: normal }, indices, material }],
    });
  }
  const nodes: GltfNode[] = GROUPS.map((group) => ({ name: group.toUpperCase(), children: [] }));
  for (const part of model.parts) {
    const group = nodes[GROUPS.indexOf(part.group)];
    if (!group?.children) throw new Error(`Unknown export group: ${part.group}`);
    const halfAngle = part.rot / 2;
    group.children.push(nodes.length);
    nodes.push({
      name: part.name,
      mesh: meshIds.get(`${part.shape}/${part.mat}`)!,
      translation: [...part.pos],
      scale: [...part.size],
      rotation: [0, Math.sin(halfAngle), 0, Math.cos(halfAngle)],
      extras: { category: part.group },
    });
  }
  // Separate trees prevent importers from moving nodes between the two scenes.
  const fullSceneOffset = nodes.length;
  const fullNodes = nodes.map((node) => ({
    ...node,
    ...(node.children ? { children: node.children.map((index) => index + fullSceneOffset) } : {}),
  }));
  nodes.push(...fullNodes);
  const doc = {
    asset: {
      version: '2.0',
      generator: 'Parametric apartment reconstruction',
      extras: model.metadata,
    },
    scene: 0,
    scenes: [
      {
        name: 'Apartment / open ceiling',
        nodes: GROUPS.flatMap((group, index) => (group === 'ceiling' ? [] : [index])),
      },
      {
        name: 'Apartment / complete shell',
        nodes: GROUPS.map((_, index) => index + fullSceneOffset),
      },
    ],
    nodes,
    meshes,
    materials,
    buffers: [{ byteLength: binaryLength }],
    bufferViews,
    accessors,
  };
  const json = new TextEncoder().encode(JSON.stringify(doc));
  const jsonLength = align4(json.length),
    paddedBinaryLength = align4(binaryLength);
  const bytes = new Uint8Array(12 + 8 + jsonLength + 8 + paddedBinaryLength);
  const header = new DataView(bytes.buffer);
  header.setUint32(0, 0x46546c67, true);
  header.setUint32(4, 2, true);
  header.setUint32(8, bytes.length, true);
  header.setUint32(12, jsonLength, true);
  header.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20, 20 + jsonLength);
  bytes.set(json, 20);
  const binaryHeader = 20 + jsonLength;
  header.setUint32(binaryHeader, paddedBinaryLength, true);
  header.setUint32(binaryHeader + 4, 0x004e4942, true);
  for (const chunk of chunks) bytes.set(chunk.bytes, binaryHeader + 8 + chunk.offset);
  return bytes;
}
