import type { ApartmentModel } from '../../model/types.ts';
import { serializeGlb } from './glb.ts';
import { serializeObj } from './obj.ts';

export function serializeApartment(model: ApartmentModel) {
  const { obj, mtl } = serializeObj(model);
  return {
    'model.json': JSON.stringify(model, null, 2) + '\n',
    'apartment.glb': serializeGlb(model),
    'apartment.obj': obj,
    'apartment.mtl': mtl,
  };
}
