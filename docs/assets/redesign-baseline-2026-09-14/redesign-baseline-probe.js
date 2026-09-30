import { _roots, addEffect, addAfterEffect } from '@react-three/fiber';

// Diagnostic wrapper only. Does not participate in the production entry point.
const panel = document.createElement('aside');
panel.style.cssText =
  'position:fixed;right:20px;bottom:65px;z-index:100;background:#20252a;color:white;padding:8px;max-width:440px;max-height:220px;overflow:auto;font:12px monospace';
const run = document.createElement('button');
run.textContent = 'Замер R0.2';
const status = document.createElement('span');
status.textContent = 'Диагностика готова';
const output = document.createElement('pre');
output.id = 'audit-result';
panel.append(run, status, output);
document.body.append(panel);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? null;
};
run.addEventListener('click', async () => {
  run.disabled = true;
  status.textContent = 'Идёт замер';
  try {
    const canvas = document.querySelector('canvas');
    const root = _roots.get(canvas).store.getState();
    const gl = root.gl;
    const context = gl.getContext();
    const debug = context.getExtension('WEBGL_debug_renderer_info');
    const environment = {
      userAgent: navigator.userAgent,
      viewport: [innerWidth, innerHeight],
      canvas: [canvas.width, canvas.height],
      dpr: devicePixelRatio,
      gpu: debug
        ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : context.getParameter(context.RENDERER),
      outputColorSpace: gl.outputColorSpace,
      toneMapping: gl.toneMapping,
      exposure: gl.toneMappingExposure,
      shadowMapType: gl.shadowMap.type,
      antialias: context.getContextAttributes().antialias,
      frameloop: root.frameloop,
      mode: document.querySelector('#ap-view').value,
      measurements: Boolean(document.querySelector('.measurement-panel')),
    };
    const rotate = document.querySelector('button[aria-label="Повернуть вправо"]');
    const trials = [];
    for (let trial = 0; trial < 3; trial++) {
      const mode = document.querySelector('#ap-view');
      // Reset the exact same preset through the real app's mode-change control.
      const initialMode = mode.value;
      mode.value = initialMode === 'top' ? 'cut' : 'top';
      mode.dispatchEvent(new Event('change', { bubbles: true }));
      await wait(100);
      mode.value = initialMode;
      mode.dispatchEvent(new Event('change', { bubbles: true }));
      await wait(200);
      const intervals = [];
      const submissionMs = [];
      let frameStart = 0;
      let last = 0;
      let previousFrame = gl.info.render.frame;
      const started = performance.now();
      const removeBefore = addEffect(() => {
        frameStart = performance.now();
      });
      const removeAfter = addAfterEffect(() => {
        const now = performance.now();
        if (gl.info.render.frame === previousFrame) return;
        previousFrame = gl.info.render.frame;
        if (now - started >= 1000) {
          if (last) intervals.push(now - last);
          submissionMs.push(now - frameStart);
          last = now;
        }
      });
      await new Promise((resolve) => {
        const tick = () => {
          if (performance.now() - started >= 5000) return resolve();
          rotate.click();
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      removeBefore();
      removeAfter();
      await wait(100);
      const idleStart = gl.info.render.frame;
      await wait(1000);
      trials.push({
        frameIntervals: intervals.length,
        fps: (intervals.length * 1000) / intervals.reduce((a, b) => a + b, 0),
        intervalMedianMs: percentile(intervals, 0.5),
        intervalP95Ms: percentile(intervals, 0.95),
        cpuSubmissionMedianMs: percentile(submissionMs, 0.5),
        cpuSubmissionP95Ms: percentile(submissionMs, 0.95),
        idleFramesInOneSecond: gl.info.render.frame - idleStart,
        drawCallsLastFrame: gl.info.render.calls,
        trianglesLastFrame: gl.info.render.triangles,
      });
    }
    output.textContent = JSON.stringify(
      {
        environment,
        protocol:
          '3 trials; 1s warmup + 4s sampling; rotate-right button once per requestAnimationFrame (22.5deg per step); 1s idle; CPU measures R3F frame callback plus render submission, not GPU time',
        trials,
      },
      null,
      2,
    );
    status.textContent = 'Замер завершён';
  } catch (error) {
    output.textContent = String(error.stack ?? error);
    status.textContent = 'Ошибка замера';
  } finally {
    run.disabled = false;
  }
});
