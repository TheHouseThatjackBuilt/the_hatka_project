import assert from 'node:assert/strict';
import test from 'node:test';
import { renderDpr, isPerformanceProfile } from '../src/viewer/performance.ts';

test('performance profiles cap resolution without oversampling low-DPR displays', () => {
  assert.equal(renderDpr('performance', 3), 1);
  assert.equal(renderDpr('balanced', 3), 1.5);
  assert.equal(renderDpr('quality', 3), 2);
  for (const profile of ['performance', 'balanced', 'quality'] as const) {
    assert.equal(renderDpr(profile, 0.8), 0.8);
    for (const invalid of [NaN, Infinity, 0, -1]) assert.equal(renderDpr(profile, invalid), 1);
  }
});

test('only supported graphics profiles can enter viewer options', () => {
  for (const value of ['performance', 'balanced', 'quality'])
    assert.ok(isPerformanceProfile(value));
  for (const value of ['', 'auto', 'vr', 'toString'])
    assert.equal(isPerformanceProfile(value), false);
});
