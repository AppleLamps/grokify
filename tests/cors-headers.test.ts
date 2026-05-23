import test from 'node:test';
import assert from 'node:assert/strict';

import { getCorsHeaders } from '@/lib/schemas';
import { SITE_URL } from '@/lib/site';

const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

test.after(() => {
  if (originalAllowedOrigins === undefined) {
    delete process.env.ALLOWED_ORIGINS;
  } else {
    process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
  }
});

test('getCorsHeaders defaults to the site origin instead of wildcard', () => {
  delete process.env.ALLOWED_ORIGINS;

  const headers = getCorsHeaders();

  assert.equal(headers['Access-Control-Allow-Origin'], SITE_URL);
  assert.equal(headers['Access-Control-Allow-Origin'], 'https://www.grokify.com');
});

test('getCorsHeaders reflects only allowed request origins', () => {
  process.env.ALLOWED_ORIGINS = 'https://www.grokify.com,https://staging.grokify.com';

  const allowed = getCorsHeaders('https://staging.grokify.com');
  const blocked = getCorsHeaders('https://evil.example');

  assert.equal(allowed['Access-Control-Allow-Origin'], 'https://staging.grokify.com');
  assert.equal(blocked['Access-Control-Allow-Origin'], undefined);
});
