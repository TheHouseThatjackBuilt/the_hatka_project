import { useEffect, useState } from 'react';
import { ViewerToolbar } from './components/ViewerToolbar.tsx';
import { ViewerViewport } from './components/ViewerViewport.tsx';
import { ViewerFooter } from './components/ViewerFooter.tsx';
import { useApartmentViewer } from './hooks/useApartmentViewer.ts';
import { DEFAULT_VIEWER_OPTIONS } from './viewer/options.ts';
import { MeasurementPanel } from './components/MeasurementPanel.tsx';

const MODEL_DOWNLOAD_URL = `${import.meta.env.BASE_URL}models/apartment/apartment.glb`;

export function App() {
  const [options, setOptions] = useState(DEFAULT_VIEWER_OPTIONS);
  const { viewportRef, labelsRef, viewerRef, status, measurement } = useApartmentViewer(options);
  const disabled = status !== 'ready';
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || options.measurementTool === 'off') return;
      if (
        measurement.pinned ||
        measurement.pointCount > 0 ||
        measurement.selectedIds.length > 0 ||
        measurement.result
      )
        viewerRef.current?.measurement({ type: 'clear' });
      else setOptions((current) => ({ ...current, measurementTool: 'off' }));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [measurement, options.measurementTool]);

  return (
    <main id="apartment-view">
      <header className="page-header">
        <h1>
          Хатка <span>· 3D-модель квартиры</span>
        </h1>
        <a href={MODEL_DOWNLOAD_URL} download>
          Скачать GLB
        </a>
      </header>
      <ViewerToolbar
        options={options}
        disabled={disabled}
        onChange={setOptions}
        onFit={() => viewerRef.current?.fit()}
      />
      <ViewerViewport
        viewportRef={viewportRef}
        labelsRef={labelsRef}
        status={status}
        downloadUrl={MODEL_DOWNLOAD_URL}
      />
      {status === 'ready' && (
        <MeasurementPanel
          tool={options.measurementTool}
          snapshot={measurement}
          onToolChange={(measurementTool) => setOptions({ ...options, measurementTool })}
          onSelect={(id, slot) => viewerRef.current?.measurement({ type: 'select', id, slot })}
          onClear={() => viewerRef.current?.measurement({ type: 'clear' })}
        />
      )}
      <ViewerFooter
        mode={options.mode}
        disabled={disabled}
        onRotate={(angle) => viewerRef.current?.rotate(angle)}
        onZoom={(factor) => viewerRef.current?.zoom(factor)}
      />
    </main>
  );
}
