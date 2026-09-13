import type {
  ModelMeasurements,
  MeasurementTarget,
  PlanRegion,
} from '../model/measurement-types.ts';
import type { ModelPart } from '../model/types.ts';
import { makeMeasurementTarget } from './core/measurement-target.ts';
import { PLAN } from './plan.ts';
import { CEILING_HEIGHT } from './core/builder.ts';

const PLAN_SOURCE = 'габарит геометрии по проектному плану; декоративные детали схематичны';
const SCHEMATIC = 'схематичная геометрия модели';
/** Explicit generation-time selectors. Runtime selection only uses serialized IDs. */
export function buildMeasurements(parts: ModelPart[]): ModelMeasurements {
  const targets: MeasurementTarget[] = [];
  function add(
    id: string,
    label: string,
    prefixes: string[],
    rotation = 0,
    source = PLAN_SOURCE,
    diameter?: number,
  ) {
    const selected = parts.filter(
      (p) => p.group === 'furniture' && prefixes.some((prefix) => p.name.startsWith(prefix)),
    );
    targets.push(
      makeMeasurementTarget(selected, {
        id,
        label,
        kind: 'object',
        rotation,
        planSource: source,
        heightSource: SCHEMATIC,
        ...(diameter === undefined ? {} : { diameter }),
      }),
    );
  }
  const objects: [string, string, string[], number?, string?][] = [
    ['sofa', 'Диван', ['Sofa ']],
    ['tv-console', 'ТВ-тумба', ['TV console ']],
    ['projector-screen', 'Экран проектора', ['Projector screen'], 0, SCHEMATIC],
    ['kitchen-worktop', 'Столешница кухни', ['Kitchen worktop ']],
    ['kitchen-sink', 'Кухонная мойка', ['Kitchen sink '], 0, SCHEMATIC],
    ['kitchen-mixer', 'Кухонный смеситель', ['Kitchen mixer'], 0, SCHEMATIC],
    ['hob', 'Варочная панель', ['Induction hob', 'Hob cooking zone'], 0, SCHEMATIC],
    ['kitchen-corner', 'Угловой модуль кухни', ['Kitchen corner return'], Math.PI / 2],
    ['kitchen-return', 'Боковой модуль кухни', ['Kitchen return base '], Math.PI / 2],
    ['kitchen-return-top', 'Боковая столешница', ['Kitchen return worktop'], Math.PI / 2],
    ['fridge', 'Холодильник', ['Refrigerator '], Math.PI / 2],
    [
      'study-desk',
      'Г-образный стол кабинета',
      ['Study south desktop', 'Study west desktop', 'Study desk '],
    ],
    [
      'study-chair-west',
      'Кресло кабинета · у левого стола',
      ['Study chair west desk '],
      -Math.PI / 2,
      SCHEMATIC,
    ],
    [
      'study-chair-south',
      'Кресло кабинета · у длинного стола',
      ['Study chair south desk '],
      0,
      SCHEMATIC,
    ],
    ['study-window-cabinet', 'Подоконная тумба кабинета', ['Study window cabinet'], Math.PI / 2],
    ['study-upper', 'Навесные шкафы кабинета', ['Study south overhead cabinets']],
    ['study-plants', 'Фитостена кабинета', ['Study plant wall '], Math.PI / 2],
    ['hall-wardrobe', 'Шкаф холла', ['Hall wardrobe ']],
    ['hall-shallow', 'Боковой шкаф холла', ['Hall shallow cupboard'], Math.PI / 2],
    ['utility-base', 'Тумба хозблока', ['Utility base cupboard ', 'Utility worktop']],
    ['laundry-cabinet', 'Корпус шкафа для техники', ['Laundry utility ']],
    ['washing-machine', 'Стиральная машина', ['Washing machine'], 0, SCHEMATIC],
    ['dryer', 'Сушильная машина', ['Tumble dryer'], 0, SCHEMATIC],
    ['utility-storage', 'Нижнее хранение хозблока', ['Utility lower storage']],
    ['hall-console', 'Консоль прихожей', ['Hall console'], Math.PI / 2],
    ['entrance-bench', 'Банкетка прихожей', ['Entrance bench '], Math.PI / 2],
    ['main-bath', 'Ванна большого санузла', ['Bathroom 1 bathtub ']],
    [
      'main-vanity',
      'Тумба большого санузла со столешницей',
      ['Bathroom 1 west double vanity', 'Bathroom 1 stone top'],
      Math.PI / 2,
    ],
    ['main-toilet', 'Унитаз большого санузла', ['Bathroom 1 WC '], 0, SCHEMATIC],
    ['main-installation', 'Инсталляция большого санузла', ['Bathroom 1 installation shelf']],
    ['bath-curtain-rod', 'Карниз шторы ванной', ['Bathroom 1 bath curtain rod'], 0, SCHEMATIC],
    ['ensuite-toilet', 'Унитаз малого санузла', ['Ensuite WC '], 0, SCHEMATIC],
    ['ensuite-bath', 'Ванна малого санузла', ['Ensuite bathtub '], Math.PI / 2],
    ['ensuite-installation', 'Инсталляция малого санузла', ['Ensuite installation shelf']],
    ['cloak-north', 'Северный шкаф гардеробной', ['Cloakroom north storage']],
    [
      'cloak-clothes',
      'Открытый шкаф с одеждой',
      ['Cloakroom clothes ', 'Cloakroom open rail', 'Cloakroom hanging garment'],
    ],
    ['cloak-west', 'Боковой шкаф гардеробной', ['Cloakroom west storage'], Math.PI / 2],
    ['cloak-south', 'Южный шкаф гардеробной', ['Cloakroom south storage']],
    ['robot-dock', 'Док робота-пылесоса', ['Robot vacuum dock'], 0, SCHEMATIC],
    ['bed', 'Кровать', ['Bed ', 'Bedroom pillow']],
    ['bedroom-storage', 'Хранение у стола спальни', ['Bedroom north storage']],
    ['bedroom-desk', 'Стол спальни', ['Bedroom desk']],
    ['bedroom-chair', 'Стул спальни', ['Bedroom chair '], Math.PI, SCHEMATIC],
    ['bedroom-curtains', 'Шторы спальни', ['Bedroom curtain pleat'], 0, SCHEMATIC],
    ['plant-rack', 'Стеллаж с растениями', ['Plant rack '], 0, SCHEMATIC],
  ];
  for (const args of objects) add(...args);
  add(
    'living-table',
    'Приставной столик',
    ['Living side table '],
    0,
    PLAN_SOURCE,
    PLAN.living.sideTable.diameter,
  );
  add(
    'dining-table',
    'Обеденный стол',
    ['Dining tabletop ', 'Dining central leg', 'Dining base'],
    0,
    PLAN_SOURCE,
    PLAN.kitchen.dining.diameter,
  );
  for (const [side, label, angle] of [
    ['west', 'западный', Math.PI / 2],
    ['east', 'восточный', -Math.PI / 2],
    ['south', 'южный', Math.PI],
  ] as const)
    add(
      `dining-chair-${side}`,
      `Обеденный стул · ${label}`,
      [`Dining chair ${side} `],
      angle,
      SCHEMATIC,
    );
  for (let i = 1; i <= 4; i++)
    add(`kitchen-base-${i}`, `Кухонный модуль ${i}${i === 1 ? ' · посудомойка' : ''}`, [
      `Kitchen base ${i}`,
    ]);
  for (let i = 1; i <= 3; i++)
    add(
      `kitchen-upper-${i}`,
      `Навесной шкаф кухни ${i}`,
      [`Kitchen wall cabinet ${i}`],
      0,
      SCHEMATIC,
    );
  for (const side of ['north', 'south'])
    add(
      `main-basin-${side}`,
      `Раковина · ${side === 'north' ? 'у ванны' : 'у инсталляции'}`,
      [`Bathroom 1 basin ${side} `],
      -Math.PI / 2,
      SCHEMATIC,
    );
  for (const side of ['west', 'east'])
    add(`bedside-${side}`, `Прикроватная тумба · ${side === 'west' ? 'левая' : 'правая'}`, [
      `Bedside table ${side} `,
    ]);
  for (const [i, x] of [0.25, 0.55].entries()) {
    const selected = parts.filter(
      (p) => p.name.startsWith('Pet bowl') && Math.abs(p.pos[0] - x) < 1e-6,
    );
    targets.push(
      makeMeasurementTarget(selected, {
        id: `pet-bowl-${i + 1}`,
        label: `Миска ${i + 1}`,
        kind: 'object',
        planSource: SCHEMATIC,
        heightSource: SCHEMATIC,
      }),
    );
  }
  for (const [i, x] of PLAN.bedroom.bedside.xs.entries()) {
    const selected = parts.filter(
      (p) =>
        p.name.startsWith('Bedside light ') &&
        Math.abs(p.pos[0] - (x + PLAN.bedroom.bedside.width / 2)) < 1e-5,
    );
    targets.push(
      makeMeasurementTarget(selected, {
        id: `bedside-light-${i + 1}`,
        label: `Прикроватный светильник ${i + 1}`,
        kind: 'object',
        planSource: SCHEMATIC,
        heightSource: SCHEMATIC,
      }),
    );
  }
  const occurrences = new Map<string, number>();
  let wallIndex = 0;
  for (const part of parts.filter((p) => p.group === 'walls')) {
    const key = part.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const count = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, count);
    targets.push(
      makeMeasurementTarget([part], {
        id: `wall-${key}-${count}`,
        label: `Стена · участок ${++wallIndex}`,
        kind: 'wall',
        rotation: part.size[2] > part.size[0] ? Math.PI / 2 : 0,
        planSource: 'участок стены модели по проектному плану',
        heightSource:
          Math.abs(part.size[1] - CEILING_HEIGHT) < 1e-6
            ? '2700 мм по принятому условию'
            : 'схематичный участок стены или перемычка',
      }),
    );
  }
  let doorIndex = 0;
  for (const part of parts.filter((p) => p.group === 'doors' && !p.name.endsWith(' hinge'))) {
    const selected = parts.filter(
      (p) => p.group === 'doors' && (p.name === part.name || p.name === `${part.name} hinge`),
    );
    targets.push(
      makeMeasurementTarget(selected, {
        id: `door-${part.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        label: `Полотно двери · ${++doorIndex}`,
        kind: 'object',
        rotation: part.rot,
        planSource: 'полотно и петли модели; не размер проёма',
        heightSource: SCHEMATIC,
      }),
    );
  }
  for (const [i, prefix] of [
    'North window 1',
    'North window 2',
    'North window 3',
    'East study wall',
    'Balcony fixed glazing',
  ].entries()) {
    const selected = parts.filter((p) => p.group === 'windows' && p.name.startsWith(prefix));
    targets.push(
      makeMeasurementTarget(selected, {
        id: `window-${i + 1}`,
        label: i < 3 ? `Северное окно ${i + 1}` : i === 3 ? 'Окно кабинета' : 'Остекление балкона',
        kind: 'object',
        rotation: i < 3 ? 0 : Math.PI / 2,
        planSource: 'рама и подоконник модели; не размер проёма',
        heightSource: SCHEMATIC,
      }),
    );
  }
  const unclassified = parts.filter((p) => p.group === 'furniture' && !p.measurementId);
  if (unclassified.length)
    throw new Error(
      `Unclassified measurement furniture: ${unclassified.map((p) => p.name).join(', ')}`,
    );
  const rect = (x: number, z: number, w: number, d: number): PlanRegion => ({
    outer: [
      [x, z],
      [x + w, z],
      [x + w, z + d],
      [x, z + d],
    ],
  });
  const bathroom = PLAN.mainBathroom,
    ensuite = PLAN.ensuite;
  const specs: [string, string, PlanRegion][] = [
    ['study', 'Кабинет', rect(PLAN.study.west, 0, PLAN.study.width, PLAN.study.south)],
    [
      'bedroom',
      'Спальня',
      rect(
        PLAN.bedroom.west,
        PLAN.transverseWall.south,
        PLAN.exterior.east - PLAN.bedroom.west,
        PLAN.exterior.bedroomSouth - PLAN.transverseWall.south,
      ),
    ],
    [
      'main-bathroom',
      'Большой санузел',
      rect(
        bathroom.west,
        bathroom.north,
        bathroom.width,
        bathroom.bathDepth +
          bathroom.vanityGap +
          bathroom.vanityLength +
          bathroom.installationDepth,
      ),
    ],
    [
      'ensuite',
      'Малый санузел',
      rect(
        ensuite.west,
        ensuite.north,
        ensuite.toiletWidth + ensuite.bathWidth,
        ensuite.south - ensuite.north,
      ),
    ],
  ];
  return {
    version: 1,
    targets,
    rooms: specs.map(([id, label, region]) => ({
      id: `room-${id}`,
      label,
      region,
      height: CEILING_HEIGHT,
      source: 'по внутренним граням стен модели, проектный план; проёмы замкнуты в плоскости стены',
      heightSource: '2700 мм по принятому условию',
    })),
  };
}
