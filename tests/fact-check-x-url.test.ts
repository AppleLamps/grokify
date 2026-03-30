import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeFactCheckXUrl } from '@/lib/fact-check-x-url';

test('normalizeFactCheckXUrl accepts x.com status URLs and strips query params', () => {
  const result = normalizeFactCheckXUrl('https://x.com/lamps_apple/status/1234567890?ref_src=twsrc%5Etfw');

  assert.equal(result.normalizedUrl, 'https://x.com/lamps_apple/status/1234567890');
  assert.equal(result.handle, 'lamps_apple');
  assert.equal(result.postId, '1234567890');
});

test('normalizeFactCheckXUrl accepts twitter.com status URLs', () => {
  const result = normalizeFactCheckXUrl('https://twitter.com/lamps_apple/status/9876543210');

  assert.equal(result.normalizedUrl, 'https://x.com/lamps_apple/status/9876543210');
  assert.equal(result.handle, 'lamps_apple');
  assert.equal(result.postId, '9876543210');
});

test('normalizeFactCheckXUrl accepts i/web status URLs when a handle is unavailable', () => {
  const result = normalizeFactCheckXUrl('https://x.com/i/web/status/112233445566778899');

  assert.equal(result.normalizedUrl, 'https://x.com/i/web/status/112233445566778899');
  assert.equal(result.handle, null);
  assert.equal(result.postId, '112233445566778899');
});

test('normalizeFactCheckXUrl strips trailing media segments from status URLs', () => {
  const result = normalizeFactCheckXUrl('https://mobile.twitter.com/lamps_apple/status/24680/photo/1');

  assert.equal(result.normalizedUrl, 'https://x.com/lamps_apple/status/24680');
  assert.equal(result.handle, 'lamps_apple');
  assert.equal(result.postId, '24680');
});

test('normalizeFactCheckXUrl rejects invalid URLs', () => {
  assert.throws(() => normalizeFactCheckXUrl('https://example.com/not-a-post'), /Invalid X post URL/);
});
