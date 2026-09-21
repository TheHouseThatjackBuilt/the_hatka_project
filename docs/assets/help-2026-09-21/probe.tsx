import React, { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ViewerHelp } from '../../../src/components/ViewerHelp.tsx';
import '../../../src/styles.css';
import '../../../src/design-system/tokens.css';

// Isolated test storage; the browser's actual storage is never read or changed.
const mode = new URLSearchParams(location.search).get('storage');
let reads = 0,
  writes = 0;
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  get: () => {
    if (mode === 'blocked') throw new DOMException('Blocked', 'SecurityError');
    return {
      getItem: () => {
        reads++;
        return mode === 'seen' ? '1' : null;
      },
      setItem: () => {
        writes++;
        if (mode === 'quota') throw new DOMException('Full', 'QuotaExceededError');
      },
    };
  },
});
const host = document.querySelector('#root')!;
const result = document.querySelector('#result')!;
let root: Root | undefined;
let ready = false;
const events: { time: number; visible: boolean }[] = [];
let previous = false;
const started = performance.now();
function report() {
  const visible = Boolean(host.querySelector('.viewer-help-content'));
  if (visible !== previous) events.push({ time: Math.round(performance.now() - started), visible });
  previous = visible;
  result.textContent = JSON.stringify({ mode, reads, writes, ready, visible, events }, null, 2);
}
new MutationObserver(report).observe(host, { childList: true, subtree: true, attributes: true });
function render() {
  root?.render(
    <StrictMode>
      <ViewerHelp ready={ready} />
    </StrictMode>,
  );
}
document.querySelector('#mount')!.addEventListener('click', () => {
  if (!root) {
    root = createRoot(host);
    render();
  }
});
document.querySelector('#unmount')!.addEventListener('click', () => {
  root?.unmount();
  root = undefined;
  report();
});
document.querySelector('#ready')!.addEventListener('click', () => {
  ready = true;
  render();
  setTimeout(report, 50);
});
root = createRoot(host);
render();
report();
