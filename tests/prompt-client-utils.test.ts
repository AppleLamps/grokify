import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cleanupPreviewUrl,
  replacePreviewUrl,
  compressImageDataUrl,
} from '@/lib/prompt-client-utils';

test('replacePreviewUrl revokes the previous object URL before replacing it', () => {
  const revoked: string[] = [];

  const next = replacePreviewUrl('blob:old-preview', 'blob:new-preview', (url) => revoked.push(url));

  assert.equal(next, 'blob:new-preview');
  assert.deepEqual(revoked, ['blob:old-preview']);
});

test('cleanupPreviewUrl revokes the active preview URL during teardown', () => {
  const revoked: string[] = [];

  cleanupPreviewUrl('blob:preview', (url) => revoked.push(url));

  assert.deepEqual(revoked, ['blob:preview']);
});

test('compressImageDataUrl returns compressed base64 data and cleans up the temporary object URL', async () => {
  const revoked: string[] = [];
  let objectUrlUsed = '';

  const result = await compressImageDataUrl({ type: 'image/png' } as File, {
    maxDimension: 1600,
    targetSizeBytes: 1024,
    createObjectUrl: () => 'blob:temp-upload',
    revokeObjectUrl: (url) => revoked.push(url),
    loadImage: async (url) => {
      objectUrlUsed = url;
      return { width: 2400, height: 1200 };
    },
    renderToDataUrl: async ({ width, height, mimeType, quality }) => {
      assert.equal(width, 1600);
      assert.equal(height, 800);
      assert.equal(mimeType, 'image/jpeg');
      assert.equal(quality, 0.82);
      return 'data:image/jpeg;base64,compressed-payload';
    },
  });

  assert.equal(objectUrlUsed, 'blob:temp-upload');
  assert.equal(result.mimeType, 'image/jpeg');
  assert.equal(result.base64, 'compressed-payload');
  assert.deepEqual(revoked, ['blob:temp-upload']);
});
