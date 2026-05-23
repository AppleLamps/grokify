import test from 'node:test';
import assert from 'node:assert/strict';

import { getLoadingOverlayProgress } from '@/lib/loading-overlay-progress';

test('photo analyze stage stays in the first-stage range', () => {
  const result = getLoadingOverlayProgress({
    type: 'photo',
    stage: 'analyze',
    elapsedSeconds: 12,
  });

  assert.equal(result.phaseLabel, 'SIGNAL ACQUISITION');
  assert.ok(result.progress >= 8);
  assert.ok(result.progress < 70);
});

test('photo image stage starts after analyze-stage progress', () => {
  const result = getLoadingOverlayProgress({
    type: 'photo',
    stage: 'image',
    elapsedSeconds: 2,
  });

  assert.equal(result.phaseLabel, 'VISUAL SYNTHESIS');
  assert.ok(result.progress >= 70);
  assert.ok(result.progress < 97);
});

test('video analyze stage remains clearly below render stage', () => {
  const analyze = getLoadingOverlayProgress({
    type: 'video',
    stage: 'analyze',
    elapsedSeconds: 8,
  });
  const render = getLoadingOverlayProgress({
    type: 'video',
    stage: 'video',
    elapsedSeconds: 8,
  });

  assert.ok(analyze.progress < render.progress);
  assert.equal(analyze.phaseLabel, 'NARRATIVE SCAN');
  assert.equal(render.phaseLabel, 'MOTION RENDER');
});

test('single-stage loaders do not claim completion early', () => {
  const result = getLoadingOverlayProgress({
    type: 'roast',
    elapsedSeconds: 3,
  });

  assert.ok(result.progress >= 6);
  assert.ok(result.progress < 35);
  assert.equal(result.statusLabel, 'ACQUIRING');
});

test('progress is capped below 100 until the request finishes', () => {
  const result = getLoadingOverlayProgress({
    type: 'osint',
    elapsedSeconds: 300,
  });

  assert.equal(result.progress, 99);
});
