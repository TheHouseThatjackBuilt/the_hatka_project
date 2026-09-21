import { Button } from './ui/Button.tsx';
import { FloatingPanel } from './ui/FloatingPanel.tsx';
import { SegmentedControl } from './ui/SegmentedControl.tsx';
import { StatusBadge } from './ui/StatusBadge.tsx';
import { Toggle } from './ui/Toggle.tsx';
import { isViewMode, VIEW_MODES } from '../viewer/options.ts';
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
        {options.mode === 'cut' && <StatusBadge>Срез · 1,05 м</StatusBadge>}
      </FloatingPanel>
    </div>
  );
}
