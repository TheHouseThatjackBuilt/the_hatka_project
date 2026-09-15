import { useEffect, useRef, useState } from 'react';
import { parseApartmentModel } from '../model/parse-model.ts';
import type { ViewerHandle, ViewerOptions, ViewerStatus } from '../viewer/types.ts';
import { EMPTY_MEASUREMENT_SNAPSHOT } from '../viewer/measurement-types.ts';
import type { MeasurementSnapshot } from '../viewer/measurement-types.ts';

export function useApartmentViewer(options: ViewerOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const fitAreaRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerHandle | null>(null);
  const latestOptions = useRef(options);
  const [status, setStatus] = useState<ViewerStatus>('loading');
  const [measurement, setMeasurement] = useState<MeasurementSnapshot>(EMPTY_MEASUREMENT_SNAPSHOT);

  useEffect(() => {
    latestOptions.current = options;
    viewerRef.current?.setOptions(options);
  }, [options]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const labels = labelsRef.current;
    if (!viewport || !labels) return;
    const abort = new AbortController();
    let activeViewer: ViewerHandle | null = null;
    setStatus('loading');
    setMeasurement(EMPTY_MEASUREMENT_SNAPSHOT);

    const start = async () => {
      try {
        const [response, { createViewer }] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}models/apartment/model.json`, { signal: abort.signal }),
          import('../viewer/index.tsx'),
        ]);
        if (!response.ok) throw new Error(`Model request failed: ${response.status}`);
        const data: unknown = await response.json();
        if (abort.signal.aborted) return;
        activeViewer = createViewer(
          viewport,
          labels,
          parseApartmentModel(data),
          latestOptions.current,
          (error) => {
            if (abort.signal.aborted) return;
            console.error('Apartment viewer:', error);
            setStatus('error');
            setMeasurement(EMPTY_MEASUREMENT_SNAPSHOT);
          },
          (snapshot) => {
            if (!abort.signal.aborted) setMeasurement(snapshot);
          },
          () => {
            const rect = fitAreaRef.current?.getBoundingClientRect();
            if (!rect) return undefined;
            const canvasRect = viewport.getBoundingClientRect();
            return {
              left: rect.left - canvasRect.left,
              top: rect.top - canvasRect.top,
              width: rect.width,
              height: rect.height,
            };
          },
        );
        viewerRef.current = activeViewer;
        await activeViewer.ready;
        if (abort.signal.aborted) return;
        setStatus('ready');
      } catch (error) {
        if (abort.signal.aborted) return;
        console.error('Apartment viewer:', error);
        setStatus('error');
        setMeasurement(EMPTY_MEASUREMENT_SNAPSHOT);
      }
    };

    void start();
    // Also runs during StrictMode's development check and React Fast Refresh.
    return () => {
      abort.abort();
      activeViewer?.dispose();
      if (viewerRef.current === activeViewer) viewerRef.current = null;
    };
  }, []);

  return { viewportRef, labelsRef, fitAreaRef, viewerRef, status, measurement };
}
