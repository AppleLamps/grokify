import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { POST as postUploadImage } from '@/app/api/upload-image/route';
import { POST as postUploadVideoIntent } from '@/app/api/upload-video/intent/route';
import { POST as postUploadVideoToken } from '@/app/api/upload-video/token/route';
import { resetInMemoryRateLimitsForTests } from '@/lib/upload-security';

const originalUploadImageLimit = process.env.UPLOAD_IMAGE_DAILY_LIMIT;
const originalUploadIntentSecret = process.env.UPLOAD_INTENT_SECRET;
const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  resetInMemoryRateLimitsForTests();

  if (originalUploadImageLimit === undefined) {
    delete process.env.UPLOAD_IMAGE_DAILY_LIMIT;
  } else {
    process.env.UPLOAD_IMAGE_DAILY_LIMIT = originalUploadImageLimit;
  }

  if (originalUploadIntentSecret === undefined) {
    delete process.env.UPLOAD_INTENT_SECRET;
  } else {
    process.env.UPLOAD_INTENT_SECRET = originalUploadIntentSecret;
  }

  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

function postJson(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
      'user-agent': 'upload-route-test',
    },
    body: JSON.stringify(body),
  });
}

test('POST /api/upload-image rejects unsupported MIME types before Blob upload', async () => {
  delete process.env.DATABASE_URL;
  const response = await postUploadImage(postJson('/api/upload-image', {
    imageDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
  }));
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.match(payload.error, /Unsupported file type/);
});

test('POST /api/upload-image enforces anonymous upload rate limits', async () => {
  delete process.env.DATABASE_URL;
  process.env.UPLOAD_IMAGE_DAILY_LIMIT = '0';

  const response = await postUploadImage(postJson('/api/upload-image', {
    imageDataUrl: `data:image/png;base64,${Buffer.from('png').toString('base64')}`,
  }));
  const payload = await response.json();

  assert.equal(response.status, 429);
  assert.match(payload.error, /Too many uploads/);
});

test('POST /api/upload-video/intent rejects invalid video metadata', async () => {
  delete process.env.DATABASE_URL;
  const response = await postUploadVideoIntent(postJson('/api/upload-video/intent', {
    contentType: 'text/plain',
    size: 100,
  }));
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'Invalid upload request');
});

test('POST /api/upload-video/token rejects requests without a signed upload intent', async () => {
  delete process.env.DATABASE_URL;
  const response = await postUploadVideoToken(postJson('/api/upload-video/token', {
    type: 'blob.generate-client-token',
    payload: {
      pathname: 'video.mp4',
      multipart: false,
      clientPayload: null,
    },
  }));
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'Failed to generate upload token');
});
