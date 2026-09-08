import type { ModelMaterial } from '../../model/types.ts';

const MATERIALS = {
  wall: ['Warm plaster', '#eeeae2', 1],
  slab: ['Concrete slab', '#aaa59b', 1],
  oak: ['Natural oak', '#bba081', 1],
  oak_light: ['Oak front', '#cfb99a', 1],
  floor: ['Oak flooring', '#d5bea0', 1],
  joint: ['Floor joints', '#bca58b', 1],
  tile: ['Warm grey tile', '#c5c5bc', 1],
  tilejoint: ['Tile grout', '#aeafa7', 1],
  white: ['Porcelain and painted joinery', '#f5f2ea', 1],
  stone: ['Pale stone worktop', '#e0dfd5', 1],
  dark: ['Graphite metal', '#41464a', 1],
  black: ['Appliance glass', '#252c30', 1],
  linen: ['Ivory upholstery', '#e4ded0', 1],
  sage: ['Sage upholstery', '#9da993', 1],
  terra: ['Clay textile', '#b47e66', 1],
  glass: ['Window glass', '#a9c4ca', 0.24],
  showerglass: ['Shower glass', '#b8d1d1', 0.18],
  mirror: ['Mirror', '#b8c7c6', 0.75],
  green: ['Leaves', '#658463', 1],
  rug: ['Woven rug', '#d6ccba', 1],
} satisfies Record<string, ModelMaterial>;

export type MaterialId = keyof typeof MATERIALS;

export function createMaterials(): Record<string, ModelMaterial> {
  return Object.fromEntries(
    Object.entries(MATERIALS).map(([id, value]) => [id, [...value] as ModelMaterial]),
  );
}
