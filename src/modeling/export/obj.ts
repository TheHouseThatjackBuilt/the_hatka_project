import type { ApartmentModel, ModelShape } from '../../model/types.ts';
import { roundTo } from '../core/round.ts';
import { primitiveGeometry } from './geometry.ts';

function fixed(value: number, digits: number) {
  const rounded = roundTo(value, digits);
  const sign = rounded === 0 && (value < 0 || Object.is(value, -0)) ? '-' : '';
  return sign + rounded.toFixed(digits);
}

export function serializeObj(model: ApartmentModel): { obj: string; mtl: string } {
  const lines = [
    '# Units: metres; Y up. Ceiling omitted for dollhouse view.',
    'mtllib apartment.mtl',
  ];
  let offset = 1;
  const cache = new Map<ModelShape, ReturnType<typeof primitiveGeometry>>();
  for (const [index, part] of model.parts.entries()) {
    if (part.group === 'ceiling') continue;
    let geometry = cache.get(part.shape);
    if (!geometry) {
      geometry = primitiveGeometry(part.shape);
      cache.set(part.shape, geometry);
    }
    const cosine = Math.cos(part.rot),
      sine = Math.sin(part.rot);
    lines.push(`o ${index}_${part.name.replaceAll(' ', '_')}`, `usemtl ${part.mat}`);
    for (let i = 0; i < geometry.positions.length; i += 3) {
      const a = geometry.positions[i]! * part.size[0];
      const b = geometry.positions[i + 1]! * part.size[1];
      const c = geometry.positions[i + 2]! * part.size[2];
      const world = [
        part.pos[0] + cosine * a + sine * c,
        part.pos[1] + b,
        part.pos[2] - sine * a + cosine * c,
      ];
      lines.push(`v ${world.map((value) => fixed(value, 5)).join(' ')}`);
    }
    for (let i = 0; i < geometry.indices.length; i += 3) {
      lines.push(
        `f ${geometry.indices
          .slice(i, i + 3)
          .map((value) => offset + value)
          .join(' ')}`,
      );
    }
    offset += geometry.positions.length / 3;
  }
  const mtl: string[] = [];
  for (const [key, [, color, alpha]] of Object.entries(model.materials)) {
    const rgb = [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16) / 255);
    mtl.push(
      `newmtl ${key}`,
      `Kd ${rgb.map((value) => fixed(value, 4)).join(' ')}`,
      `d ${fixed(alpha, 3)}`,
      'Ns 30',
      '',
    );
  }
  return { obj: lines.join('\n'), mtl: mtl.join('\n') };
}
