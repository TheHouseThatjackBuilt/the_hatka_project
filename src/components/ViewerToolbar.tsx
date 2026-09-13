import { isViewMode, VIEW_MODES } from '../viewer/options.ts';
import type { ViewerOptions } from '../viewer/types.ts';

interface ViewerToolbarProps {
  options: ViewerOptions;
  disabled: boolean;
  onChange(options: ViewerOptions): void;
  onFit(): void;
}

export function ViewerToolbar({ options, disabled, onChange, onFit }: ViewerToolbarProps) {
  return (
    <fieldset id="ap-toolbar" disabled={disabled} aria-label="Настройки просмотра">
      <label className="view-field" htmlFor="ap-view">
        Вид
        <select
          id="ap-view"
          value={options.mode}
          onChange={(event) => {
            const mode = event.currentTarget.value;
            if (isViewMode(mode)) onChange({ ...options, mode });
          }}
        >
          {VIEW_MODES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={options.furnitureVisible}
          onChange={(event) =>
            onChange({ ...options, furnitureVisible: event.currentTarget.checked })
          }
        />
        Мебель
      </label>
      <button
        type="button"
        aria-pressed={options.measurementTool !== 'off'}
        onClick={() =>
          onChange({
            ...options,
            measurementTool: options.measurementTool === 'off' ? 'objects' : 'off',
          })
        }
      >
        Размеры
      </button>
      <label className="check-field">
        <input
          type="checkbox"
          checked={options.labelsVisible}
          onChange={(event) => onChange({ ...options, labelsVisible: event.currentTarget.checked })}
        />
        Названия
      </label>
      <button
        type="button"
        aria-pressed={options.panMode}
        onClick={() => onChange({ ...options, panMode: !options.panMode })}
      >
        Перемещать
      </button>
      <button type="button" onClick={onFit}>
        Вписать модель
      </button>
    </fieldset>
  );
}
