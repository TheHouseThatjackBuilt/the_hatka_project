import { useState } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { IconButton } from '../components/ui/IconButton.tsx';
import { FloatingPanel } from '../components/ui/FloatingPanel.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { Toggle } from '../components/ui/Toggle.tsx';

export function PrimitivesPreview() {
  const [clicks, setClicks] = useState(0);
  const [furniture, setFurniture] = useState(true);
  const [labels, setLabels] = useState(false);
  const [pan, setPan] = useState(false);
  const countClick = () => setClicks((value) => value + 1);

  return (
    <section className="foundations-section" aria-labelledby="primitives-title">
      <div className="foundations-heading">
        <h2 id="primitives-title">Компоненты управления</h2>
        <p>R1.2 · Кнопки, панель, статусы и переключатели</p>
      </div>
      <div className="foundations-button-grid">
        {(['primary', 'secondary', 'ghost'] as const).map((variant) => (
          <div className="foundations-component-sample" key={variant}>
            <h3>{variant}</h3>
            <div className="foundations-demo-row">
              <Button variant={variant} size="sm" onClick={countClick}>
                Кнопка sm
              </Button>
              <Button variant={variant} size="md" onClick={countClick}>
                Кнопка md
              </Button>
            </div>
            <div className="foundations-demo-row">
              <Button variant={variant} size="sm" disabled onClick={countClick}>
                Недоступно sm
              </Button>
              <Button variant={variant} size="md" disabled onClick={countClick}>
                Недоступно md
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="foundations-demo-columns">
        <div className="foundations-component-sample">
          <h3>IconButton · 28 / 32 px</h3>
          <div className="foundations-demo-row">
            <IconButton aria-label="Уменьшить образец" size="sm" onClick={countClick}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <path d="M3 8h10" />
              </svg>
            </IconButton>
            <IconButton aria-label="Увеличить образец" size="md" onClick={countClick}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <path d="M3 8h10M8 3v10" />
              </svg>
            </IconButton>
            <IconButton aria-label="Недоступное уменьшение" size="sm" disabled onClick={countClick}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <path d="M3 8h10" />
              </svg>
            </IconButton>
            <IconButton aria-label="Недоступное увеличение" size="md" disabled onClick={countClick}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <path d="M3 8h10M8 3v10" />
              </svg>
            </IconButton>
          </div>
          <Button variant="ghost" aria-pressed={pan} onClick={() => setPan((value) => !value)}>
            Перемещать
          </Button>
          <p className="foundations-note">
            Активное состояние кнопки сохраняется до повторного нажатия.
          </p>
          <output aria-live="polite" className="foundations-note">
            Нажатий на образцы: {clicks}
          </output>
        </div>
        <FloatingPanel
          role="group"
          aria-labelledby="panel-demo-title"
          className="foundations-component-sample"
        >
          <h3 id="panel-demo-title">FloatingPanel · Настройки</h3>
          <Toggle label="Мебель" checked={furniture} onCheckedChange={setFurniture} />
          <Toggle label="Названия" checked={labels} onCheckedChange={setLabels} />
          <Toggle
            label="Недоступно · выключено"
            checked={false}
            disabled
            onCheckedChange={countClick}
          />
          <Toggle
            label="Недоступно · включено"
            checked={true}
            disabled
            onCheckedChange={countClick}
          />
          <StatusBadge>Потолки 2,70 м · Срез 1,05 м</StatusBadge>
        </FloatingPanel>
      </div>
      <p className="foundations-note">
        Tab — переход между контролами. Кнопки — Enter или пробел; переключатели — пробел. Образцы
        изменяют только эту страницу.
      </p>
    </section>
  );
}
