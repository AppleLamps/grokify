import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getHomeVideoUnavailableMessage,
  getImagineVideoUnavailableMessage,
  getHomePhotoUnavailableMessage,
  getImagineImageUnavailableMessage,
  isGrokImageGenerationEnabled,
  isGrokVideoGenerationEnabled,
} from '@/lib/grok-image-availability';

test('Grok image generation is disabled globally', () => {
  assert.equal(isGrokImageGenerationEnabled(), false);
});

test('Grok video generation is disabled globally', () => {
  assert.equal(isGrokVideoGenerationEnabled(), false);
});

test('home page unavailable message directs users to Nano Banana Pro', () => {
  assert.match(getHomePhotoUnavailableMessage(), /temporarily unavailable/i);
  assert.match(getHomePhotoUnavailableMessage(), /Nano Banana Pro/);
});

test('imagine page image unavailable message explains Grok Imagine is down', () => {
  assert.match(getImagineImageUnavailableMessage(), /temporarily unavailable/i);
  assert.match(getImagineImageUnavailableMessage(), /Grok Imagine/i);
});

test('home page video unavailable message explains the shutdown', () => {
  assert.match(getHomeVideoUnavailableMessage(), /temporarily/i);
  assert.match(getHomeVideoUnavailableMessage(), /video/i);
});

test('imagine page video unavailable message explains the shutdown', () => {
  assert.match(getImagineVideoUnavailableMessage(), /temporarily/i);
  assert.match(getImagineVideoUnavailableMessage(), /video/i);
});
