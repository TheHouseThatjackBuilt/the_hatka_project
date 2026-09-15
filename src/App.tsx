import { useEffect, useRef, useState } from 'react';
import { ViewerToolbar } from './components/ViewerToolbar.tsx';
import { ViewerViewport } from './components/ViewerViewport.tsx';
import { ViewerFooter } from './components/ViewerFooter.tsx';
import { useApartmentViewer } from './hooks/useApartmentViewer.ts';
import { DEFAULT_VIEWER_OPTIONS } from './viewer/options.ts';
import { MeasurementPanel } from './components/MeasurementPanel.tsx';
import './design-system/fonts.css';
import './design-system/tokens.css';

const MODEL_DOWNLOAD_URL = `${import.meta.env.BASE_URL}models/apartment/apartment.glb`;

export function App() {
  const [options, setOptions] = useState(DEFAULT_VIEWER_OPTIONS);
  const measurementButtonRef = useRef<HTMLButtonElement>(null);
  const { viewportRef, labelsRef, fitAreaRef, viewerRef, status, measurement } =
    useApartmentViewer(options);
  const disabled = status !== 'ready';
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== 'Escape' || options.measurementTool === 'off')
        return;
      if (
        measurement.pinned ||
        measurement.pointCount > 0 ||
        measurement.selectedIds.length > 0 ||
        measurement.result
      )
        viewerRef.current?.measurement({ type: 'clear' });
      else {
        setOptions((current) => ({ ...current, measurementTool: 'off' }));
        measurementButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [measurement, options.measurementTool]);

  return (
    <main id="apartment-view" className="hatka-theme">
      <header className="page-header">
        <h1>
          Хатка <span>· 3D-модель квартиры</span>
        </h1>
        <a
          className="hatka-button hatka-button--secondary hatka-control--sm"
          href={MODEL_DOWNLOAD_URL}
          download
        >
          Скачать GLB
        </a>
      </header>
      <ViewerToolbar
        options={options}
        disabled={disabled}
        onChange={setOptions}
        measurementButtonRef={measurementButtonRef}
      />
      <ViewerViewport
        viewportRef={viewportRef}
        labelsRef={labelsRef}
        status={status}
        downloadUrl={MODEL_DOWNLOAD_URL}
      />
      <div className="viewer-fit-area" ref={fitAreaRef} aria-hidden="true" />
      {status === 'ready' && (
        <MeasurementPanel
          tool={options.measurementTool}
          snapshot={measurement}
          onToolChange={(measurementTool) => setOptions({ ...options, measurementTool })}
          onSelect={(id, slot) => viewerRef.current?.measurement({ type: 'select', id, slot })}
          onClear={() => viewerRef.current?.measurement({ type: 'clear' })}
          onClose={() => {
            setOptions((current) => ({ ...current, measurementTool: 'off' }));
            measurementButtonRef.current?.focus();
          }}
        />
      )}
      <ViewerFooter
        mode={options.mode}
        disabled={disabled}
        panMode={options.panMode}
        onPanToggle={() => setOptions((current) => ({ ...current, panMode: !current.panMode }))}
        onFit={() => viewerRef.current?.fit()}
        onRotate={(angle) => viewerRef.current?.rotate(angle)}
        onZoom={(factor) => viewerRef.current?.zoom(factor)}
      />
    </main>
  );
}
