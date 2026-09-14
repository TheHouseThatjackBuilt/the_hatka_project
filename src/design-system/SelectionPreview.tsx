import { useState } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { Select, type SelectOption } from '../components/ui/Select.tsx';
import { SegmentedControl } from '../components/ui/SegmentedControl.tsx';
import { Tooltip } from '../components/ui/Tooltip.tsx';

const views = [
  { value: 'cut', label: 'Разрез' },
  { value: 'full', label: '3D' },
  { value: 'top', label: 'План' },
];
const objects: readonly SelectOption[] = [
  { value: 'sofa', label: 'Диван · кухня-гостиная' },
  { value: 'unavailable', label: 'Недоступный предмет', disabled: true },
  { value: 'table', label: 'Стол · кухня-гостиная' },
  ...Array.from({ length: 130 }, (_, index) => ({
    value: `sample-${index}`,
    label: `Образец ${String(index + 1).padStart(3, '0')} · длинный список предметов для проверки прокрутки`,
  })),
  {
    value: 'wardrobe',
    label: 'Шкаф · гардеробная — длинное название предмета с фасадами и ручками',
  },
];

export function SelectionPreview() {
  const [view, setView] = useState('cut');
  const [vertical, setVertical] = useState('cut');
  const [object, setObject] = useState('sofa');
  const [mounted, setMounted] = useState(true);
  const [hintClicks, setHintClicks] = useState(0);
  return (
    <section className="foundations-section" aria-labelledby="selection-title">
      <div className="foundations-heading">
        <h2 id="selection-title">Выбор и подсказки</h2>
        <p>R1.3 · Режимы, длинные списки и помощь</p>
      </div>
      <div className="foundations-demo-columns foundations-selection-columns">
        <div className="foundations-component-sample">
          <h3>SegmentedControl</h3>
          <SegmentedControl
            label="Вид образца"
            options={views}
            value={view}
            onValueChange={setView}
          />
          <SegmentedControl
            label="Вертикальный вид"
            options={views.map((option) => ({ ...option, disabled: option.value === 'full' }))}
            value={vertical}
            onValueChange={setVertical}
            orientation="vertical"
            size="sm"
          />
          <SegmentedControl
            label="Недоступный вид"
            options={views}
            value="cut"
            onValueChange={setView}
            disabled
            size="sm"
          />
          <p className="foundations-note">Стрелки меняют режим. Отключённые пункты пропускаются.</p>
        </div>
        <div className="foundations-component-sample">
          <h3>Select · 134 пункта</h3>
          {mounted && (
            <Select
              label="Предмет образца"
              options={objects}
              value={object}
              onValueChange={setObject}
              aria-describedby="select-help"
            />
          )}
          <p className="foundations-note" id="select-help">
            Стрелки, Home/End, Page Up/Down; набор «шкаф» находит пункт. Enter или Tab — выбрать,
            Esc — отменить.
          </p>
          <Select
            label="Недоступный список"
            options={objects.slice(0, 3)}
            value="sofa"
            onValueChange={setObject}
            disabled
          />
          <Select
            label="Пустой список"
            options={[]}
            value=""
            onValueChange={setObject}
            placeholder="Нет доступных предметов"
          />
          <Tooltip content="Подсказка появляется через 400 мс. Escape скрывает её; фокус остаётся на кнопке.">
            {(props) => (
              <Button {...props} onClick={() => setHintClicks((value) => value + 1)}>
                Как выбрать предмет
              </Button>
            )}
          </Tooltip>
          <output className="foundations-note">Нажатий на кнопку с подсказкой: {hintClicks}</output>
          <Button variant="ghost" onClick={() => setMounted((value) => !value)}>
            {mounted ? 'Убрать образец списка' : 'Вернуть образец списка'}
          </Button>
        </div>
      </div>
      <p className="foundations-note">
        Список демонстрационный: проверяет длину и прокрутку, не описывает реальные размеры
        квартиры.
      </p>
    </section>
  );
}
