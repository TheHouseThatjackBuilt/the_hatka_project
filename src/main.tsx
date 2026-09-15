import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing React root element');

const showFoundations = new URLSearchParams(window.location.search).get('ui') === 'foundations';
const FoundationsPreview = lazy(() => import('./design-system/FoundationsPreview.tsx'));

createRoot(container).render(
  <StrictMode>
    {showFoundations ? (
      <Suspense fallback={<p role="status">Загрузка образцов…</p>}>
        <FoundationsPreview />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
