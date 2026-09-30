import type { FloorTileFormat } from '../model/flooring-types.ts';
import type { FloorSelection } from '../viewer/flooring-options.ts';
import { Select, type SelectOption } from './ui/Select.tsx';
import './floor-controls.css';

export interface FloorControlsProps {
  selection: FloorSelection;
  formats: readonly FloorTileFormat[];
  disabled: boolean;
  onChange(selection: FloorSelection): void;
}

const DIRECTION_OPTIONS: readonly SelectOption[] = [
  { value: 'x', label: 'По горизонтали' },
  { value: 'z', label: 'По вертикали' },
];

function formatLabel(format: FloorTileFormat) {
  return `${format.width * 100} × ${format.length * 100} см`;
}

export function FloorControls({ selection, formats, disabled, onChange }: FloorControlsProps) {
  const formatOptions = formats.map((format) => ({
    value: format.id,
    label: formatLabel(format),
  }));
  const formatValue = formats.some((format) => format.id === selection.formatId)
    ? selection.formatId
    : '';
  const directionValue =
    selection.direction === 'x' || selection.direction === 'z' ? selection.direction : '';

  return (
    <details className={`floor-controls${disabled ? ' is-disabled' : ''}`}>
      <summary>Пол</summary>
      <div className="floor-controls-content">
        <h2>Керамогранит под дерево</h2>
        <Select
          id="floor-format"
          label="Формат плитки"
          options={formatOptions}
          value={formatValue}
          disabled={disabled || formatOptions.length === 0}
          onValueChange={(formatId) => {
            if (formats.some((format) => format.id === formatId)) {
              onChange({ formatId, direction: selection.direction });
            }
          }}
        />
        <Select
          id="floor-direction"
          label="Направление укладки"
          options={DIRECTION_OPTIONS}
          value={directionValue}
          disabled={disabled}
          onValueChange={(direction) => {
            if (direction === 'x' || direction === 'z') {
              onChange({ formatId: selection.formatId, direction });
            }
          }}
        />
        <p className="floor-controls-help">Длинная сторона плитки на плане сверху.</p>
        <p className="floor-controls-summary">Смещение ⅓ · шов 2 мм</p>
        <p className="floor-controls-note">Приближённый рисунок покрытия</p>
      </div>
    </details>
  );
}
