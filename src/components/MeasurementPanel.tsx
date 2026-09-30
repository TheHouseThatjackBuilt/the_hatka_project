import type { MeasurementSnapshot, MeasurementTool } from '../viewer/measurement-types.ts';
import { Button } from './ui/Button.tsx';
import { IconButton } from './ui/IconButton.tsx';
import { Select } from './ui/Select.tsx';
import { StatusBadge } from './ui/StatusBadge.tsx';

interface MeasurementPanelProps {
  tool: MeasurementTool;
  snapshot: MeasurementSnapshot;
  onToolChange(tool: MeasurementTool): void;
  onSelect(id: string, slot?: 0 | 1): void;
  onClear(): void;
  onClose(): void;
}

export function MeasurementPanel({
  tool,
  snapshot,
  onToolChange,
  onSelect,
  onClear,
  onClose,
}: MeasurementPanelProps) {
  if (tool === 'off') return null;
  const choices = tool === 'rooms' ? snapshot.rooms : snapshot.objects;
  const options = choices.map(({ id, label }) => ({ value: id, label }));
  const select = (label: string, slot?: 0 | 1) => (
    <Select
      key={label}
      label={label}
      value={snapshot.selectedIds[slot ?? 0] ?? ''}
      options={options}
      disabled={!snapshot.available}
      onValueChange={(id) => onSelect(id, slot)}
    />
  );

  return (
    <aside id="ap-measurement-panel" className="measurement-panel" aria-label="Размеры">
      <div className="measurement-heading">
        <h2>Размеры</h2>
        <IconButton size="sm" variant="ghost" aria-label="Закрыть размеры" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </IconButton>
      </div>
      <div className="measurement-tools" role="group" aria-label="Инструмент размеров">
        {(
          [
            ['objects', 'Объекты'],
            ['rooms', 'Комнаты'],
            ['distance', 'Расстояние'],
            ['points', 'Две точки'],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            aria-pressed={tool === key}
            disabled={!snapshot.available}
            onClick={() => onToolChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="measurement-body" role="region" aria-label="Данные измерения" tabIndex={0}>
        {!snapshot.available ? (
          <p className="measurement-note">В этой модели нет данных размеров.</p>
        ) : (
          <>
            {tool === 'points' ? (
              <p className="measurement-hint" aria-live="polite">
                {snapshot.pinned
                  ? 'Измерение закреплено.'
                  : snapshot.pointCount
                    ? 'Выберите вторую точку.'
                    : 'Выберите первую точку на модели.'}{' '}
                Стрелки и Enter на модели — выбор с клавиатуры; Shift — точный шаг.
              </p>
            ) : tool === 'distance' ? (
              <div className="measurement-pairs">
                {select('Объект A', 0)}
                {select('Объект B', 1)}
              </div>
            ) : (
              select(tool === 'rooms' ? 'Комната' : 'Предмет')
            )}
            {tool === 'rooms' && (
              <p className="measurement-note">
                Доступны кабинет, спальня и два санузла. Границы остальных зон ещё требуют
                согласования.
              </p>
            )}
            {snapshot.result && (
              <div
                className="measurement-result"
                aria-live={snapshot.pinned ? 'polite' : undefined}
              >
                <h3>{snapshot.result.title}</h3>
                <dl>
                  {snapshot.result.values.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
                {snapshot.result.note && (
                  <details className="measurement-source">
                    <summary>Основания размеров</summary>
                    <p>{snapshot.result.note}</p>
                  </details>
                )}
              </div>
            )}
            {!snapshot.result && tool !== 'points' && (
              <p className="measurement-hint">
                Наведите на {tool === 'rooms' ? 'открытый участок пола' : 'предмет'} или выберите в
                списке. Нажмите, чтобы закрепить размер.
              </p>
            )}
          </>
        )}
      </div>
      <div className="measurement-actions">
        <StatusBadge aria-live="polite">
          {snapshot.pinned
            ? 'Закреплено'
            : snapshot.pointCount || snapshot.selectedIds.length
              ? 'Выбор начат'
              : snapshot.result
                ? 'Предпросмотр'
                : 'Нет выбора'}
        </StatusBadge>
        <Button
          size="sm"
          className="measurement-clear"
          disabled={!snapshot.available}
          onClick={onClear}
        >
          {tool === 'distance' || tool === 'points' ? 'Новое измерение' : 'Снять выбор'}
        </Button>
      </div>
    </aside>
  );
}
