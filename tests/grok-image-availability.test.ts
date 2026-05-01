import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getHomeVideoUnavailableMessage,
  getImagineVideoUnavailableMessage,
  getHomePhotoUnavailableMessage,
  getImagineImageUnavailableMessage,
  isGrokImageGenerationEnabled,
  isGrokVideoGenerationEnabled,
  parseGrokAvailabilityFlag,
} from '@/lib/grok-image-availability';

test('Grok image generation is disabled globally', () => {
  assert.equal(isGrokImageGenerationEnabled(), false);
});

test('Grok video generation is disabled globally', () => {
  assert.equal(isGrokVideoGenerationEnabled(), false);
});

test('parseGrokAvailabilityFlag accepts explicit enabled values only', () => {
  assert.equal(parseGrokAvailabilityFlag('true'), true);
  assert.equal(parseGrokAvailabilityFlag('1'), true);
  assert.equal(parseGrokAvailabilityFlag('yes'), true);
  assert.equal(parseGrokAvailabilityFlag('on'), true);
  assert.equal(parseGrokAvailabilityFlag('false'), false);
  assert.equal(parseGrokAvailabilityFlag(''), false);
  assert.equal(parseGrokAvailabilityFlag(undefined), false);
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
