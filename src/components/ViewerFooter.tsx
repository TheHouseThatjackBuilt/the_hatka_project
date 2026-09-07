import { MODE_TEXT } from '../viewer/options.ts';
import type { ViewMode } from '../viewer/types.ts';

interface ViewerFooterProps {
  mode: ViewMode;
  disabled: boolean;
  onRotate(angle: number): void;
  onZoom(factor: number): void;
}

export function ViewerFooter({ mode, disabled, onRotate, onZoom }: ViewerFooterProps) {
  return (
    <footer id="ap-footer">
      <fieldset id="ap-navigation" disabled={disabled} aria-label="Управление камерой">
        <button type="button" aria-label="Повернуть влево" onClick={() => onRotate(-Math.PI / 8)}>
          ↶
        </button>
        <button type="button" aria-label="Повернуть вправо" onClick={() => onRotate(Math.PI / 8)}>
          ↷
        </button>
        <button type="button" aria-label="Отдалить" onClick={() => onZoom(1 / 1.15)}>
          −
        </button>
        <button type="button" aria-label="Приблизить" onClick={() => onZoom(1.15)}>
          +
        </button>
      </fieldset>
      <span id="ap-state" className="text-muted" aria-live="polite">
        {MODE_TEXT[mode]}
      </span>
      <span id="ap-help" className="text-muted">
        Вращение — левая кнопка · перемещение — правая или Shift · масштаб — колёсико
      </span>
    </footer>
  );
}
