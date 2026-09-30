import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CUT_HEIGHT,
  effectiveCutHeight,
  normalizeCutHeight,
} from '../src/viewer/cut-height.ts';

test('normalizes cut height to the configured range and step', () => {
  assert.equal(normalizeCutHeight(Number.NaN), DEFAULT_CUT_HEIGHT);
  assert.equal(normalizeCutHeight(Number.POSITIVE_INFINITY), DEFAULT_CUT_HEIGHT);
  assert.equal(normalizeCutHeight(0), 0.3);
  assert.equal(normalizeCutHeight(4), 2.7);
  assert.equal(normalizeCutHeight(1.073), 1.05);
  assert.equal(normalizeCutHeight(1.076), 1.1);
});

test('uses the default height outside cut mode', () => {
  assert.equal(effectiveCutHeight('cut', 2.4), 2.4);
  assert.equal(effectiveCutHeight('cut', 0.1), 0.3);
  assert.equal(effectiveCutHeight('top', 2.4), DEFAULT_CUT_HEIGHT);
  assert.equal(effectiveCutHeight('full', 2.4), DEFAULT_CUT_HEIGHT);
});
