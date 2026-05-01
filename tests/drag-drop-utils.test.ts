import test from 'node:test';
import assert from 'node:assert/strict';

import { getDroppedFiles, hasFilesInTransfer } from '@/lib/drag-drop-utils';

test('hasFilesInTransfer returns true when the drag payload contains files', () => {
  const hasFiles = hasFilesInTransfer({
    types: ['Files', 'text/plain'],
  } as unknown as DataTransfer);

  assert.equal(hasFiles, true);
});

test('hasFilesInTransfer returns false when the drag payload contains no files', () => {
  const hasFiles = hasFilesInTransfer({
    types: ['text/plain'],
  } as unknown as DataTransfer);

  assert.equal(hasFiles, false);
});

test('getDroppedFiles returns file objects from a drop payload', () => {
  const firstFile = { name: 'first.png' } as File;
  const secondFile = { name: 'second.png' } as File;
  const files = getDroppedFiles({
    files: [firstFile, secondFile],
  } as unknown as DataTransfer);

  assert.deepEqual(files, [firstFile, secondFile]);
});

test('getDroppedFiles returns an empty array when no files were dropped', () => {
  const files = getDroppedFiles({
    files: [],
  } as unknown as DataTransfer);

  assert.deepEqual(files, []);
});
