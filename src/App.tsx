import { useState } from 'react';
import { ViewerToolbar } from './components/ViewerToolbar.tsx';
import { ViewerViewport } from './components/ViewerViewport.tsx';
import { ViewerFooter } from './components/ViewerFooter.tsx';
import { useApartmentViewer } from './hooks/useApartmentViewer.ts';
import { DEFAULT_VIEWER_OPTIONS } from './viewer/options.ts';

const MODEL_DOWNLOAD_URL = `${import.meta.env.BASE_URL}models/apartment/apartment.glb`;

export function App() {
  const [options, setOptions] = useState(DEFAULT_VIEWER_OPTIONS);
  const { viewportRef, labelsRef, viewerRef, status } = useApartmentViewer(options);
  const disabled = status !== 'ready';

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
      <ViewerFooter
        mode={options.mode}
        disabled={disabled}
        onRotate={(angle) => viewerRef.current?.rotate(angle)}
        onZoom={(factor) => viewerRef.current?.zoom(factor)}
      />
    </main>
  );
}
