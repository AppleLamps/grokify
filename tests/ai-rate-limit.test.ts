import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { POST as postGenerateImage } from '@/app/api/generate-image/route';
import { POST as postRoastAccount } from '@/app/api/roast-account/route';
import { enforceAiRateLimit } from '@/lib/ai-rate-limit';
import { resetInMemoryRateLimitsForTests } from '@/lib/upload-security';

const originalGenerateImageLimit = process.env.AI_GENERATE_IMAGE_DAILY_LIMIT;
const originalRoastLimit = process.env.AI_ROAST_ACCOUNT_DAILY_LIMIT;

afterEach(() => {
  resetInMemoryRateLimitsForTests();

  if (originalGenerateImageLimit === undefined) {
    delete process.env.AI_GENERATE_IMAGE_DAILY_LIMIT;
  } else {
    process.env.AI_GENERATE_IMAGE_DAILY_LIMIT = originalGenerateImageLimit;
  }

  if (originalRoastLimit === undefined) {
    delete process.env.AI_ROAST_ACCOUNT_DAILY_LIMIT;
  } else {
    process.env.AI_ROAST_ACCOUNT_DAILY_LIMIT = originalRoastLimit;
  }
});

test('enforceAiRateLimit returns 429 when the configured limit is zero', async () => {
  process.env.AI_GENERATE_IMAGE_DAILY_LIMIT = '0';

  const request = new NextRequest('http://localhost/api/generate-image', {
    method: 'POST',
    headers: {
      'x-forwarded-for': '203.0.113.10',
      'user-agent': 'ai-rate-limit-test',
    },
  });

  const response = await enforceAiRateLimit(request, 'generate-image');
  assert.ok(response);
  assert.equal(response.status, 429);
  const payload = await response.json();
  assert.match(payload.error, /Too many requests/);
});

test('POST /api/generate-image enforces anonymous AI rate limits', async () => {
  process.env.AI_GENERATE_IMAGE_DAILY_LIMIT = '0';

  const request = new NextRequest('http://localhost/api/generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt: 'A neon city', handle: 'testuser' }),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '203.0.113.11',
      'user-agent': 'generate-image-rate-limit-test',
    },
  });

  const response = await postGenerateImage(request);
  const payload = await response.json();

  assert.equal(response.status, 429);
  assert.match(payload.error, /Too many requests/);
});

test('POST /api/roast-account enforces anonymous AI rate limits', async () => {
  process.env.AI_ROAST_ACCOUNT_DAILY_LIMIT = '0';

  const request = new NextRequest('http://localhost/api/roast-account', {
    method: 'POST',
    body: JSON.stringify({ handle: 'testuser' }),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '203.0.113.12',
      'user-agent': 'roast-account-rate-limit-test',
    },
  });

  const response = await postRoastAccount(request);
  const payload = await response.json();

  assert.equal(response.status, 429);
  assert.match(payload.error, /Too many requests/);
});
