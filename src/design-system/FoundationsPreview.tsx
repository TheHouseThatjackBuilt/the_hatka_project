import { useState, type CSSProperties } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { PrimitivesPreview } from './PrimitivesPreview.tsx';
import fontLicenseUrl from './fonts/LICENSE.txt?url';
import './fonts.css';
import './tokens.css';
import './preview.css';

const palette = [
  ['scene-bg-center', 'Центр сцены'],
  ['scene-bg-edge', 'Край сцены'],
  ['surface-1', 'Панель'],
  ['surface-2', 'Контрол'],
  ['surface-raised', 'Поднятая поверхность'],
  ['border', 'Граница'],
  ['border-strong', 'Выделенная граница'],
  ['text-1', 'Основной текст'],
  ['text-2', 'Вторичный текст'],
  ['text-3', 'Неактивный текст'],
  ['accent', 'Акцент'],
  ['accent-quiet', 'Тихий акцент'],
] as const;

function sampleStyle(name: string, value: string): CSSProperties {
  return { [name]: value } as CSSProperties;
}

export default function FoundationsPreview() {
  const [alternateNumbers, setAlternateNumbers] = useState(false);

  return (
    <main className="hatka-theme foundations">
      <header className="foundations-header">
        <div>
          <h1>
            Хатка <span>/ Визуальная основа</span>
          </h1>
          <p>R1.1–R1.2 · Визуальная основа и компоненты</p>
        </div>
        <a href={import.meta.env.BASE_URL}>К квартире →</a>
      </header>

      <div className="foundations-content">
        <PrimitivesPreview />
        <section className="foundations-section" aria-labelledby="palette-title">
          <div className="foundations-heading">
            <h2 id="palette-title">Палитра</h2>
            <p>Тёмные поверхности · спокойный синий акцент</p>
          </div>
          <ul className="foundations-palette">
            {palette.map(([token, label]) => (
              <li key={token}>
                <div
                  className="foundations-swatch"
                  style={sampleStyle('--sample-color', `var(--${token})`)}
                />
                <span>{label}</span>
                <code>--{token}</code>
              </li>
            ))}
          </ul>
        </section>

        <div className="foundations-columns">
          <section className="foundations-section" aria-labelledby="type-title">
            <div className="foundations-heading">
              <h2 id="type-title">IBM Plex Sans</h2>
              <p>Локальный шрифт · кириллица и латиница · 400 / 500</p>
            </div>
            <div className="foundations-type">
              {(['lg', 'md', 'sm', 'xs'] as const).map((size, index) => (
                <div key={size} className="foundations-type-row">
                  <span className="foundations-meta">{[15, 13, 12, 11][index]} px</span>
                  <div style={{ fontSize: `var(--font-${size})` }}>
                    <p>Кухня-гостиная · Living room</p>
                    <p className="foundations-medium">Съёмка, объём, этаж · Medium</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="foundations-numbers">
              <div>
                <span className="foundations-meta">Цифры одинаковой ширины</span>
                <output aria-live="polite">
                  {alternateNumbers ? '88,88 × 88,88 м' : '11,11 × 11,11 м'}
                </output>
              </div>
              <Button onClick={() => setAlternateNumbers((value) => !value)}>Сменить цифры</Button>
            </div>
          </section>

          <section className="foundations-section" aria-labelledby="states-title">
            <div className="foundations-heading">
              <h2 id="states-title">Состояния и фокус</h2>
              <p>Tab для перехода · Enter или пробел для действия</p>
            </div>
            <div className="foundations-controls">
              <label htmlFor="sample-name">Название комнаты</label>
              <input id="sample-name" defaultValue="Кухня-гостиная" />
              <label htmlFor="sample-mode">Вид</label>
              <select id="sample-mode" defaultValue="cut">
                <option value="cut">3D · разрез стен</option>
                <option value="full">3D · полные стены</option>
                <option value="top">План сверху</option>
              </select>
              <Button disabled>Недоступное действие</Button>
            </div>
            <p className="foundations-note">
              Это образцы оформления. Переход цвета — 120 мс; при уменьшении движения в системе —
              без перехода.
            </p>
          </section>
        </div>

        <section className="foundations-section" aria-labelledby="spacing-title">
          <div className="foundations-heading">
            <h2 id="spacing-title">Ритм и поверхности</h2>
            <p>Отступы 4–32 px · скругления 5 / 8 px · одна тень панели</p>
          </div>
          <div className="foundations-rhythm">
            <ul className="foundations-spacing">
              {[4, 8, 12, 16, 24, 32].map((size, index) => (
                <li key={size}>
                  <span style={{ width: `var(--s-${index + 1})` }} />
                  <code>{size} px</code>
                </li>
              ))}
            </ul>
            <div className="foundations-radius foundations-radius-sm">Контрол · 5 px</div>
            <div className="foundations-radius foundations-radius-md">Панель · 8 px</div>
          </div>
        </section>
        <footer className="foundations-note">
          Образцы визуальной системы · Select, SegmentedControl и Tooltip — следующий этап R1.3
          {' · '}
          <a href={fontLicenseUrl}>Лицензия шрифта</a>
        </footer>
      </div>
    </main>
  );
}
