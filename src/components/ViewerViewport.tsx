import type { RefObject } from 'react';
import type { ViewerStatus } from '../viewer/types.ts';

interface ViewerViewportProps {
  viewportRef: RefObject<HTMLDivElement | null>;
  labelsRef: RefObject<HTMLDivElement | null>;
  status: ViewerStatus;
  downloadUrl: string;
}

export function ViewerViewport({
  viewportRef,
  labelsRef,
  status,
  downloadUrl,
}: ViewerViewportProps) {
  return (
    <section id="ap-scene" aria-label="3D-модель квартиры" aria-busy={status === 'loading'}>
      <div
        className="ap-canvas-container"
        ref={viewportRef}
        role="img"
        aria-label="Вращаемая 3D-модель квартиры. Кухня-гостиная, кабинет, спальня, два санузла, гардеробная и балкон."
      />
      <div id="ap-room-labels" ref={labelsRef} aria-hidden="true" />
      {status !== 'ready' && (
        <div id="ap-loading" role="status">
          <span>
            {status === 'error'
              ? 'Не удалось запустить 3D-просмотр. Попробуйте обновить страницу или скачать модель.'
              : 'Загрузка 3D…'}
          </span>
          {status === 'error' && (
            <a href={downloadUrl} download>
              Скачать модель GLB
            </a>
          )}
        </div>
      )}
    </section>
  );
}
