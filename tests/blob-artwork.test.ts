import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BLOB_ARTWORK_PREFIX,
  buildArtworkBlobPath,
  extractUsernameFromArtworkPathname,
} from '@/lib/blob-artwork';

test('buildArtworkBlobPath uses the grokify prefix', () => {
  assert.equal(
    buildArtworkBlobPath('abc123', 'png', 'test_user'),
    `${BLOB_ARTWORK_PREFIX}/abc123__testuser.png`,
  );
});

test('extractUsernameFromArtworkPathname supports legacy xpressionist paths', () => {
  assert.equal(
    extractUsernameFromArtworkPathname('xpressionist/abc123__legacyuser.png'),
    'legacyuser',
  );
  assert.equal(
    extractUsernameFromArtworkPathname('grokify/abc123__newuser.webp'),
    'newuser',
  );
});
