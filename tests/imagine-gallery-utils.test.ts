import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStoredGalleryImage } from '@/lib/imagine-gallery-utils';

test('buildStoredGalleryImage keeps thumbnails for image records', () => {
  const item = buildStoredGalleryImage(
    {
      id: 'img-1',
      prompt: 'forest',
      createdAt: 1,
      aspectRatio: '1:1',
      folderId: null,
      type: 'image',
    },
    'blob:thumb-image',
  );

  assert.equal(item.thumbnailUrl, 'blob:thumb-image');
});

test('buildStoredGalleryImage does not attach placeholder thumbnail urls to video records', () => {
  const item = buildStoredGalleryImage(
    {
      id: 'vid-1',
      prompt: 'wave',
      createdAt: 1,
      aspectRatio: '16:9',
      folderId: null,
      type: 'video',
      url: 'https://example.com/video.mp4',
    },
    'blob:placeholder-thumb',
  );

  assert.equal(item.thumbnailUrl, undefined);
  assert.equal(item.url, 'https://example.com/video.mp4');
});
