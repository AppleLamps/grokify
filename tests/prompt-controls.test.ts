import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPromptControlBlock, normalizeLightingMode } from '../lib/prompt-controls';

test('buildPromptControlBlock returns empty string when no controls are active', () => {
  assert.equal(buildPromptControlBlock({}), '');
});

test('buildPromptControlBlock includes all selected prompt controls', () => {
  const block = buildPromptControlBlock({
    detailBoost: true,
    realismBias: true,
    lightingMode: 'NEON',
  });

  assert.match(block, /Increase scene richness/);
  assert.match(block, /Favor realistic anatomy/);
  assert.match(block, /Use neon-driven lighting/);
});

test('normalizeLightingMode falls back to AUTO for invalid values', () => {
  assert.equal(normalizeLightingMode('MOONBEAM'), 'AUTO');
});
