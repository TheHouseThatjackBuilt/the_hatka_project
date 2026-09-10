import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { ModelPart } from '../src/model/types.ts';
import { buildApartment } from '../src/modeling/build-apartment.ts';
import { createModelBuilder } from '../src/modeling/core/builder.ts';
import { cabinet } from '../src/modeling/furniture/cabinet.ts';

const model = buildApartment();
const audit = JSON.parse(
  readFileSync(new URL('../docs/plan-dimensions-audit.json', import.meta.url), 'utf8'),
) as {
  dimensions: { id: string; printedMm: number; vectorMm: number }[];
};
type Bounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  width: number;
  depth: number;
};
function bounds(parts: ModelPart[]): Bounds {
  assert.ok(parts.length, 'measurement must select existing model parts');
  const boxes = parts.map((p) => {
    const c = Math.abs(Math.cos(p.rot)),
      s = Math.abs(Math.sin(p.rot));
    const rx =
      p.shape === 'sphere'
        ? Math.hypot(c * p.size[0], s * p.size[2]) / 2
        : (c * p.size[0] + s * p.size[2]) / 2;
    const rz =
      p.shape === 'sphere'
        ? Math.hypot(s * p.size[0], c * p.size[2]) / 2
        : (s * p.size[0] + c * p.size[2]) / 2;
    return {
      minX: p.pos[0] - rx,
      maxX: p.pos[0] + rx,
      minZ: p.pos[2] - rz,
      maxZ: p.pos[2] + rz,
      minY: p.pos[1] - p.size[1] / 2,
      maxY: p.pos[1] + p.size[1] / 2,
    };
  });
  const minX = Math.min(...boxes.map((b) => b.minX)),
    maxX = Math.max(...boxes.map((b) => b.maxX));
  const minZ = Math.min(...boxes.map((b) => b.minZ)),
    maxZ = Math.max(...boxes.map((b) => b.maxZ));
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    minY: Math.min(...boxes.map((b) => b.minY)),
    maxY: Math.max(...boxes.map((b) => b.maxY)),
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}
const named = (name: string) => bounds(model.parts.filter((p) => p.name === name));
const item = (prefix: string) => bounds(model.parts.filter((p) => p.name.startsWith(prefix)));
const mm = (metres: number, expected: number, message: string) =>
  assert.ok(
    Math.abs(metres * 1000 - expected) < 0.025,
    `${message}: ${metres * 1000} mm, expected ${expected} mm`,
  );

test('furniture footprints and clearances match every audited printed dimension line', () => {
  // These checks measure actual generated geometry against independently transcribed
  // PDF labels. They deliberately do not read PLAN implementation constants.
  const measurements: [number, number][] = [
    [9270, item('Bedside table west').width],
    [9275, item('Bedside table west').depth],
    [9280, item('Bedside table east').width],
    [9285, item('Bedside table east').depth],
    [9290, named('Bed frame').width],
    [9295, named('Bed frame').depth],
    [9300, named('Entrance bench base').depth],
    [9305, item('Hall console').depth],
    [9310, item('Hall console').width],
    [9315, named('Entrance bench base').width],
    [9320, item('Laundry utility').width],
    [9325, item('Utility base cupboard').width],
    [9330, item('Utility base cupboard').depth],
    [9335, item('Hall wardrobe').width],
    [9340, item('Ensuite north wall').minZ - item('Hall wardrobe').maxZ],
    [9344, item('Hall wardrobe').depth],
    [9348, named('Ensuite north wall right').minX - named('Ensuite north wall left').maxX],
    [9353, item('Ensuite bathtub').minX - item('Ensuite west wall').maxX],
    [9357, item('Ensuite bathtub').width],
    [9361, item('Ensuite bathtub').depth],
    [9366, named('Bedroom door lintel').depth],
    [9376, item('Hall console').minX - item('Cloakroom east wall').maxX],
    [9381, item('Cloakroom east wall').minX - named('West exterior').maxX],
    [9386, item('Cloakroom west storage').depth],
    [9390, item('Cloakroom clothes').depth],
    [9394, item('Cloakroom west storage').width],
    [9399, item('TV console').width],
    [9404, item('TV console').depth],
    [9408, item('TV console').minZ - item('Sofa').maxZ],
    [9411, item('Sofa').depth],
    [9415, item('Sofa').width],
    [9420, named('Kitchen west return').minZ - named('Living room north pier').maxZ],
    [9425, item('Kitchen base 1').width],
    [9429, item('Kitchen base 2').width],
    [9432, item('Kitchen base 3').width],
    [9435, item('Kitchen base 4').width],
    [9438, item('Kitchen corner return').width],
    [9442, item('Kitchen corner return').depth],
    [9446, item('Kitchen return base').depth],
    [9449, item('Refrigerator').depth],
    [9453, named('Bedroom desk').minX - item('Bedroom north storage').minX],
    [9458, named('Study south desktop').depth],
    [9462, named('Study west desktop').depth],
    [9466, item('Study plant wall').depth],
    [9471, item('Study plant wall').width],
    [9476, named('Study west desktop').width],
    [9481, named('East study wall upper').minX - named('Study partition with door upper').maxX],
    [9486, named('Living side table D500').width],
    [9491, item('Study south overhead cabinets').depth],
    [9496, named('Study south desktop').minZ],
    [9501, item('Study window cabinet').minX - named('Study west desktop').maxX],
    [9506, item('Bathroom 1 east wall').minX - named('West exterior').maxX],
    [9511, named('Bed frame').minZ - named('Bedroom desk').maxZ],
    [9515, named('Bedroom desk').depth],
    [9519, named('Bedroom desk').width],
    [
      9524,
      named('Study partition with door lower').minZ - named('Study partition with door upper').maxZ,
    ],
    [9529, named('Bathroom 1 east wall lower').minZ - named('Bathroom 1 east wall upper').maxZ],
    [9534, item('Bathroom 1 west double vanity').depth],
    [9541, item('Bathroom 1 bathtub').depth],
    [9545, item('Bathroom 1 west double vanity').width],
    [9549, named('Bathroom 1 WC bowl').minX - item('Bathroom 1 west double vanity').maxX],
    [
      9553,
      item('Bathroom 1 east wall').minX -
        model.parts.find((p) => p.name === 'Bathroom 1 WC bowl')!.pos[0],
    ],
    [9749, named('Dining tabletop D900').width],
    [9754, item('Kitchen base 3').depth],
  ];
  assert.equal(
    measurements.length,
    audit.dimensions.length,
    'all transcribed lines must have a model check',
  );
  for (const [id, value] of measurements) {
    const reference = audit.dimensions.find((d) => d.id === `pdf-line-${id}`);
    assert.ok(reference, `missing independent source line ${id}`);
    mm(value, reference.printedMm, reference.id);
  }
  mm(
    item('Bathroom 1 west double vanity').minZ - item('Bathroom 1 bathtub').maxZ,
    155,
    'bath-to-vanity gap',
  );
  mm(
    named('Hall utility entrance wall lower').minZ - named('Hall utility entrance wall upper').maxZ,
    923,
    'hall door',
  );
});

test('labelled kitchen chain closes against both walls and the bed stays inside its footprint', () => {
  const modules = [
    'Kitchen base 1',
    'Kitchen base 2',
    'Kitchen base 3',
    'Kitchen base 4',
    'Kitchen corner return',
  ].map(item);
  mm(modules[0]!.minX - named('Kitchen west return').maxX, 0, 'kitchen west contact');
  for (let i = 1; i < modules.length; i++)
    mm(modules[i]!.minX - modules[i - 1]!.maxX, 0, `kitchen join ${i}`);
  mm(
    named('Study partition with door lower').minX - modules.at(-1)!.maxX,
    0,
    'kitchen east contact',
  );
  const bed = bounds(
    model.parts.filter((p) => p.name.startsWith('Bed ') || p.name === 'Bedroom pillow'),
  );
  mm(bed.width, 1800, 'complete bed width');
  mm(bed.depth, 2100, 'complete bed length');
  assert.ok(item('Study window cabinet').maxX <= named('East study wall upper').minX + 0.00001);
  mm(
    named('Study south desktop').maxX - named('East study wall upper').minX,
    0,
    'south desk east contact',
  );
});

test('cabinet fronts and pulls stay in the specified footprint for every orientation', () => {
  for (const front of ['north', 'south', 'east', 'west'] as const) {
    const builder = createModelBuilder();
    cabinet(builder, 'Measured cabinet', 2, 3, 0.882, 0.55, 0.89, 'oak_light', front);
    const b = bounds(builder.parts);
    mm(b.width, 882, `${front} width including handles`);
    mm(b.depth, 550, `${front} depth including handles`);
    mm(b.minX, 2000, `${front} origin X`);
    mm(b.minZ, 3000, `${front} origin Z`);
  }
});

test('the calibrated exterior, stepped south wall, windows and balcony retain their reviewed dimensions', () => {
  mm(named('West exterior').minX, -250, 'west exterior face');
  mm(named('East study wall upper').minX, 10002, 'east interior face after kitchen reconciliation');
  mm(named('East study wall upper').maxX, 10252, 'east exterior face');
  mm(named('South utility exterior').minZ, 6545, 'utility south interior face');
  mm(named('South bedroom exterior').minZ, 6599, 'bedroom south interior face');
  mm(named('South bedroom exterior').maxZ, 6795, 'south exterior face');
  mm(item('Entrance door wall').maxZ, 8022, 'entrance exterior face');
  for (const [name, x, width] of [
    ['North window 1 sill', 571, 1950],
    ['North window 2 sill', 3589, 1575],
    ['North window 3 sill', 7084, 1575],
  ] as const) {
    mm(named(name).minX, x, `${name} start`);
    mm(named(name).width, width, `${name} width`);
  }
  mm(named('East study wall sill').minZ, 495, 'east study window start');
  mm(named('East study wall sill').depth, 1950, 'east study window length');
  mm(named('Balcony slab').width, 1109, 'balcony width including guard');
  mm(named('Balcony slab').depth, 2455, 'balcony depth including guard');
});

test('plan furniture remains below the ceiling and does not penetrate architectural walls', () => {
  const overlaps: string[] = [];
  const walls = model.parts.filter((p) => p.group === 'walls').map((p) => ({ p, b: bounds([p]) }));
  for (const part of model.parts.filter((p) => p.group === 'furniture')) {
    const b = bounds([part]);
    assert.ok(b.minY >= -0.00001, `${part.name} is below the floor`);
    assert.ok(b.maxY <= 2.7 + 0.00001, `${part.name} exceeds the ceiling`);
    for (const { p: wall, b: w } of walls) {
      const dx = Math.min(b.maxX, w.maxX) - Math.max(b.minX, w.minX);
      const dz = Math.min(b.maxZ, w.maxZ) - Math.max(b.minZ, w.minZ);
      const dy = Math.min(b.maxY, w.maxY) - Math.max(b.minY, w.minY);
      if (dx >= 0.0001 && dz >= 0.0001 && dy >= 0.0001)
        overlaps.push(
          `${part.name} intersects ${wall.name} by ${dx * 1000} × ${dz * 1000} × ${dy * 1000} mm`,
        );
    }
  }
  assert.deepEqual(overlaps, []);
});
