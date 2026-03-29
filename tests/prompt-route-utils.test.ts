import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRetryDelayMs,
  shouldRetryPromptRequest,
} from '@/lib/prompt-route-utils';

test('shouldRetryPromptRequest does not retry 429 responses for image prompts', () => {
  assert.equal(shouldRetryPromptRequest(429, true), false);
});

test('shouldRetryPromptRequest still retries transient server failures for text prompts', () => {
  assert.equal(shouldRetryPromptRequest(503, false), true);
});

test('getRetryDelayMs honors Retry-After seconds before using fallback delays', () => {
  const headers = new Headers({ 'retry-after': '7' });

  assert.equal(getRetryDelayMs(headers, 0, [250, 750]), 7000);
});

test('getRetryDelayMs falls back to configured delay when Retry-After is absent', () => {
  assert.equal(getRetryDelayMs(new Headers(), 1, [250, 750]), 750);
});
