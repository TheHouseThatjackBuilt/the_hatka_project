import { useEffect, useRef, useState } from 'react';
import { parseApartmentModel } from '../model/parse-model.ts';
import type { ViewerHandle, ViewerOptions, ViewerStatus } from '../viewer/types.ts';

export function useApartmentViewer(options: ViewerOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerHandle | null>(null);
  const latestOptions = useRef(options);
  const [status, setStatus] = useState<ViewerStatus>('loading');

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

    const start = async () => {
      try {
        const [response, { createViewer }] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}models/apartment/model.json`, { signal: abort.signal }),
          import('../viewer/index.ts'),
        ]);
        if (!response.ok) throw new Error(`Model request failed: ${response.status}`);
        const data: unknown = await response.json();
        if (abort.signal.aborted) return;
        activeViewer = createViewer(
          viewport,
          labels,
          parseApartmentModel(data),
          latestOptions.current,
        );
        viewerRef.current = activeViewer;
        setStatus('ready');
      } catch (error) {
        if (abort.signal.aborted) return;
        console.error('Apartment viewer:', error);
        setStatus('error');
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

  return { viewportRef, labelsRef, viewerRef, status };
}
