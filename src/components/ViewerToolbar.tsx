import { Button } from './ui/Button.tsx';
import { FloatingPanel } from './ui/FloatingPanel.tsx';
import { SegmentedControl } from './ui/SegmentedControl.tsx';
import { Select } from './ui/Select.tsx';
import { Toggle } from './ui/Toggle.tsx';
import { FloorControls } from './FloorControls.tsx';
import { FLOOR_COMPARISON_FORMATS } from '../viewer/flooring-options.ts';
import {
  MAX_CUT_HEIGHT,
  MIN_CUT_HEIGHT,
  CUT_HEIGHT_STEP,
  formatCutHeight,
  isViewMode,
  VIEW_MODES,
} from '../viewer/options.ts';
import { isPerformanceProfile, PERFORMANCE_OPTIONS } from '../viewer/performance.ts';
import type { ViewerOptions } from '../viewer/types.ts';
import type { Ref } from 'react';

interface ViewerToolbarProps {
  options: ViewerOptions;
  disabled: boolean;
  onChange(options: ViewerOptions): void;
  measurementButtonRef: Ref<HTMLButtonElement>;
}
const VIEW_OPTIONS = VIEW_MODES.map(({ value }) => ({
  value,
  label: value === 'cut' ? 'Срез' : value === 'full' ? 'Полный' : 'Сверху',
}));

export function ViewerToolbar({
  options,
  disabled,
  onChange,
  measurementButtonRef,
}: ViewerToolbarProps) {
  return (
    <div id="ap-toolbar" className="viewer-tools">
      <FloatingPanel className="viewer-view-panel" aria-label="Вид квартиры">
        <SegmentedControl
          label="Вид квартиры"
          options={VIEW_OPTIONS}
          value={options.mode}
          disabled={disabled}
          orientation="vertical"
          onValueChange={(value) => {
            if (isViewMode(value)) onChange({ ...options, mode: value });
          }}
        />
      </FloatingPanel>
      <FloatingPanel className="viewer-settings-panel" aria-label="Настройки просмотра">
        <Toggle
          label="Мебель"
          checked={options.furnitureVisible}
          disabled={disabled}
          onCheckedChange={(checked) => onChange({ ...options, furnitureVisible: checked })}
        />
        <Toggle
          label="Названия"
          checked={options.labelsVisible}
          disabled={disabled}
          onCheckedChange={(checked) => onChange({ ...options, labelsVisible: checked })}
        />
        <Select
          label="Графика"
          options={PERFORMANCE_OPTIONS}
          value={options.performanceProfile}
          disabled={disabled}
          aria-describedby="performance-profile-help"
          onValueChange={(value) => {
            if (isPerformanceProfile(value)) onChange({ ...options, performanceProfile: value });
          }}
        />
        <span id="performance-profile-help" className="sr-only">
          Быстрее отключает тени; баланс и качество повышают чёткость изображения и теней.
        </span>
        <Button
          ref={measurementButtonRef}
          aria-expanded={options.measurementTool !== 'off'}
          aria-controls={options.measurementTool !== 'off' ? 'ap-measurement-panel' : undefined}
          aria-pressed={options.measurementTool !== 'off'}
          disabled={disabled}
          onClick={() =>
            onChange({
              ...options,
              measurementTool: options.measurementTool === 'off' ? 'objects' : 'off',
            })
          }
        >
          Размеры
        </Button>
        {options.mode === 'cut' && (
          <div className="cut-height-control">
            <label htmlFor="cut-height">Высота среза</label>
            <output htmlFor="cut-height" aria-live="polite">
              {formatCutHeight(options.cutHeight)} м
            </output>
            <input
              id="cut-height"
              type="range"
              min={MIN_CUT_HEIGHT}
              max={MAX_CUT_HEIGHT}
              step={CUT_HEIGHT_STEP}
              value={options.cutHeight}
              disabled={disabled}
              aria-label="Высота среза"
              onChange={(event) =>
                onChange({ ...options, cutHeight: event.currentTarget.valueAsNumber })
              }
            />
          </div>
        )}
        {options.flooring && (
          <FloorControls
            selection={options.flooring}
            formats={FLOOR_COMPARISON_FORMATS}
            disabled={disabled}
            onChange={(flooring) => onChange({ ...options, flooring })}
          />
        )}
      </FloatingPanel>
    </div>
  );
}
