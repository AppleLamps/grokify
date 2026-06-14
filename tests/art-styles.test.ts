import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ART_STYLES } from '../lib/art-styles';
import { STYLE_PROMPTS, getValidStyleIds } from '../lib/style-prompts';

test('art style metadata, prompts, and thumbnails stay in sync', () => {
  const metadataIds = ART_STYLES.map((style) => style.id);
  const promptIds = Object.keys(STYLE_PROMPTS);
  const validStyleIds = getValidStyleIds();
  const thumbnailIds = readdirSync(join(process.cwd(), 'public', 'styles'))
    .filter((fileName) => fileName.endsWith('.webp'))
    .map((fileName) => fileName.replace(/\.webp$/, ''))
    .sort();

  assert.equal(new Set(metadataIds).size, metadataIds.length, 'art style IDs must be unique');
  assert.deepEqual(promptIds.sort(), metadataIds.toSorted(), 'prompt IDs must match art style metadata IDs');
  assert.deepEqual(validStyleIds.toSorted(), metadataIds.toSorted(), 'valid style IDs must come from art style metadata');
  assert.deepEqual(thumbnailIds, metadataIds.toSorted(), 'thumbnail filenames must match art style metadata IDs');
});
