import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { POST as postImagineImage } from '@/app/api/imagine/route';
import { POST as postImagineVideo } from '@/app/api/imagine-video/route';
import {
  GROK_IMAGE_TEMPORARILY_UNAVAILABLE_MESSAGE,
  GROK_VIDEO_TEMPORARILY_UNAVAILABLE_MESSAGE,
} from '@/lib/grok-image-availability';

test('POST /api/imagine returns maintenance response when image generation is disabled', async () => {
  const request = new NextRequest('http://localhost/api/imagine', {
    method: 'POST',
    body: JSON.stringify({ prompt: 'A glowing forest' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await postImagineImage(request);
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.error, GROK_IMAGE_TEMPORARILY_UNAVAILABLE_MESSAGE);
});

test('POST /api/imagine-video returns maintenance response when video generation is disabled', async () => {
  const request = new NextRequest('http://localhost/api/imagine-video', {
    method: 'POST',
    body: JSON.stringify({ prompt: 'A glowing forest video' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await postImagineVideo(request);
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.error, GROK_VIDEO_TEMPORARILY_UNAVAILABLE_MESSAGE);
});
