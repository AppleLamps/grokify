import test from 'node:test';
import assert from 'node:assert/strict';

import { parseVideoPollResult } from '@/lib/video-poll-result';

test('parseVideoPollResult returns a completed result for done payloads with a video url', () => {
  const result = parseVideoPollResult({
    status: 'done',
    progress: 100,
    model: 'grok-imagine-video',
    video: {
      url: 'https://vidgen.x.ai/xai-vidgen-bucket/xai-video-cb3a83ec-322f-4318-990d-166bab11d328.mp4',
      duration: 1,
      respect_moderation: true,
    },
  });

  assert.deepEqual(result, {
    status: 'done',
    progress: 100,
    videoUrl: 'https://vidgen.x.ai/xai-vidgen-bucket/xai-video-cb3a83ec-322f-4318-990d-166bab11d328.mp4',
    duration: 1,
    respectsModeration: true,
    error: null,
  });
});

test('parseVideoPollResult extracts error messages from object-form error payloads', () => {
  const result = parseVideoPollResult({
    status: 'failed',
    progress: 0,
    error: {
      code: 'invalid_argument',
      message: 'Video prompt violated policy',
    },
  });

  assert.deepEqual(result, {
    status: 'failed',
    progress: 0,
    videoUrl: null,
    duration: null,
    respectsModeration: null,
    error: 'Video prompt violated policy',
  });
});

test('parseVideoPollResult keeps pending progress without inventing an error', () => {
  const result = parseVideoPollResult({
    status: 'pending',
    progress: 42,
  });

  assert.deepEqual(result, {
    status: 'pending',
    progress: 42,
    videoUrl: null,
    duration: null,
    respectsModeration: null,
    error: null,
  });
});
