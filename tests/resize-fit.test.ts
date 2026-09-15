import assert from 'node:assert/strict';
import test from 'node:test';
import { createResizeFit } from '../src/viewer/resize-fit.ts';

test('window fit waits for the last resize and runs once', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let fits = 0;
  const resize = createResizeFit(() => fits++);
  t.after(() => resize.dispose());
  resize.schedule();
  t.mock.timers.tick(100);
  resize.schedule();
  t.mock.timers.tick(149);
  assert.equal(fits, 0);
  assert.equal(resize.pending, true);
  t.mock.timers.tick(1);
  assert.equal(fits, 1);
  assert.equal(resize.pending, false);
  t.mock.timers.tick(1000);
  assert.equal(fits, 1);
});

test('manual camera input and disposal cancel pending fit; disposed scheduler cannot restart', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let fits = 0;
  const resize = createResizeFit(() => fits++);
  resize.schedule();
  resize.cancel();
  t.mock.timers.tick(150);
  assert.equal(fits, 0);
  resize.schedule();
  resize.dispose();
  resize.schedule();
  t.mock.timers.tick(300);
  assert.equal(fits, 0);
  assert.equal(resize.pending, false);
});

test('hidden resize waits without polling, resumes when visible and remains cancellable', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let visible = false;
  let fits = 0;
  const resize = createResizeFit(
    () => fits++,
    () => visible,
  );
  t.after(() => resize.dispose());
  resize.schedule();
  t.mock.timers.tick(150);
  assert.equal(resize.pending, true);
  t.mock.timers.tick(10000);
  assert.equal(fits, 0);
  resize.cancel();
  visible = true;
  if (resize.pending) resize.schedule();
  t.mock.timers.tick(150);
  assert.equal(fits, 0);
  visible = false;
  resize.schedule();
  t.mock.timers.tick(150);
  visible = true;
  if (resize.pending) resize.schedule();
  t.mock.timers.tick(150);
  assert.equal(fits, 1);
});
