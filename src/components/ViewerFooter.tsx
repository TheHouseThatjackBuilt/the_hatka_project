import { MODE_TEXT } from '../viewer/options.ts';
import type { ViewMode } from '../viewer/types.ts';
import { FloatingPanel } from './ui/FloatingPanel.tsx';
import { IconButton } from './ui/IconButton.tsx';
import { StatusBadge } from './ui/StatusBadge.tsx';
import { Tooltip } from './ui/Tooltip.tsx';
import type { ReactNode } from 'react';

interface ViewerFooterProps {
  mode: ViewMode;
  disabled: boolean;
  onRotate(angle: number): void;
  onZoom(factor: number): void;
  panMode: boolean;
  onPanToggle(): void;
  onFit(): void;
}
const Icon = ({ children }: { children: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d={children} />
  </svg>
);
function Action({
  label,
  disabled,
  onClick,
  pressed,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick(): void;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip content={label}>
      {(props) => (
        <IconButton
          {...props}
          aria-label={label}
          aria-pressed={pressed}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </IconButton>
      )}
    </Tooltip>
  );
}
export function ViewerFooter({
  mode,
  disabled,
  onRotate,
  onZoom,
  panMode,
  onPanToggle,
  onFit,
}: ViewerFooterProps) {
  return (
    <>
      <aside id="ap-camera" aria-label="Управление камерой">
        <FloatingPanel className="viewer-camera" id="ap-navigation">
          <Action
            label="Повернуть влево"
            disabled={disabled}
            onClick={() => onRotate(-Math.PI / 8)}
          >
            <Icon> M8 7H4l3-3M4 7a8 8 0 1 1 2 8</Icon>
          </Action>
          <Action
            label="Повернуть вправо"
            disabled={disabled}
            onClick={() => onRotate(Math.PI / 8)}
          >
            <Icon> M16 7h4l-3-3M20 7a8 8 0 1 0-2 8</Icon>
          </Action>
          <Action label="Отдалить" disabled={disabled} onClick={() => onZoom(1 / 1.15)}>
            <Icon> M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13m5.5 12 5 5M7.5 10.5h6</Icon>
          </Action>
          <Action label="Приблизить" disabled={disabled} onClick={() => onZoom(1.15)}>
            <Icon> M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13m5.5 12 5 5M7.5 10.5h6m-3-3v6</Icon>
          </Action>
          <Action
            label="Перемещать камеру"
            pressed={panMode}
            disabled={disabled}
            onClick={onPanToggle}
          >
            <Icon> M12 5v14m-7-7h14M7 7l-2-2m12 2 2-2m-12 12-2 2m12-2 2 2</Icon>
          </Action>
          <Action label="Вписать модель" disabled={disabled} onClick={onFit}>
            <Icon> M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5</Icon>
          </Action>
        </FloatingPanel>
      </aside>
      <footer id="ap-footer">
        <StatusBadge id="ap-state" aria-live="polite">
          {MODE_TEXT[mode]}
        </StatusBadge>
        <details className="viewer-help">
          <summary>Управление</summary>
          <div className="viewer-help-content">
            <p>
              Вращение — левая кнопка мыши · перемещение — правая или Shift · масштаб — колёсико.
            </p>
            <p>
              На сенсорном экране один палец вращает, два — перемещают и меняют масштаб. «Перемещать
              камеру» включает панорамирование одним пальцем или левой кнопкой мыши.
            </p>
          </div>
        </details>
      </footer>
    </>
  );
}
