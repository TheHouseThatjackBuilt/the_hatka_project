import type { MeasurementSnapshot, MeasurementTool } from '../viewer/measurement-types.ts';

interface MeasurementPanelProps {
  tool: MeasurementTool;
  snapshot: MeasurementSnapshot;
  onToolChange(tool: MeasurementTool): void;
  onSelect(id: string, slot?: 0 | 1): void;
  onClear(): void;
}

export function MeasurementPanel({
  tool,
  snapshot,
  onToolChange,
  onSelect,
  onClear,
}: MeasurementPanelProps) {
  if (tool === 'off') return null;
  const choices = tool === 'rooms' ? snapshot.rooms : snapshot.objects;
  const value = (slot: number) => snapshot.selectedIds[slot] ?? '';
  const select = (label: string, slot?: 0 | 1) => (
    <label className="measurement-select">
      {label}
      <select
        value={value(slot ?? 0)}
        onChange={(event) => event.currentTarget.value && onSelect(event.currentTarget.value, slot)}
      >
        <option value="">Выберите…</option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <aside className="measurement-panel" aria-label="Размеры">
      <div className="measurement-tools" role="group" aria-label="Инструмент размеров">
        {(
          [
            ['objects', 'Объекты'],
            ['rooms', 'Комнаты'],
            ['distance', 'Расстояние'],
            ['points', 'Две точки'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tool === key}
            onClick={() => onToolChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {tool === 'points' ? (
        <p className="measurement-hint">
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
          Доступны кабинет, спальня и два санузла. Границы остальных зон ещё требуют согласования.
        </p>
      )}
      {snapshot.result && (
        <div className="measurement-result" aria-live={snapshot.pinned ? 'polite' : undefined}>
          <strong>{snapshot.result.title}</strong>
          {snapshot.result.values.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span> {item.value}
            </div>
          ))}
          {snapshot.result.note && <p>{snapshot.result.note}</p>}
        </div>
      )}
      {!snapshot.available && <p>В этой модели нет данных размеров.</p>}
      {snapshot.available && !snapshot.result && tool !== 'points' && (
        <p className="measurement-hint">
          Наведите на {tool === 'rooms' ? 'открытый участок пола' : 'предмет'} или выберите в
          списке. Нажмите, чтобы закрепить размер.
        </p>
      )}
      {snapshot.pinned && tool !== 'points' && (
        <p className="measurement-hint">Выбор закреплён. Снимите его для нового наведения.</p>
      )}
      <button type="button" className="measurement-clear" onClick={onClear}>
        {tool === 'distance' || tool === 'points' ? 'Новое измерение' : 'Снять выбор'}
      </button>
    </aside>
  );
}
