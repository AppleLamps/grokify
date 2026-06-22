import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOINTPIC_SEARCH_LOG,
  PHOTO_SEARCH_LOG,
  getSearchLog,
  getStatusMessages,
  interpolateLogTemplate,
} from '@/lib/loading-overlay-copy';

test('photo analyze exposes X search log templates', () => {
  const log = getSearchLog('photo', 'analyze');
  assert.ok(log.some((entry) => entry.includes('from:{user}')));
  assert.deepEqual(
    PHOTO_SEARCH_LOG.slice(1, 8),
    [
      'QUERY from:{user} min_faves:10000',
      'QUERY from:{user} min_faves:5000',
      'QUERY from:{user} min_faves:1000',
      'QUERY from:{user} min_faves:500',
      'QUERY from:{user} min_faves:100',
      'QUERY from:{user} min_faves:10',
      'QUERY from:{user} min_faves:1',
    ],
  );
});

test('interpolateLogTemplate replaces subject placeholders', () => {
  assert.equal(
    interpolateLogTemplate('QUERY from:{user} min_faves:10000', 'elonmusk'),
    'QUERY from:elonmusk min_faves:10000',
  );
});

test('joint pic analyze logs start with higher engagement thresholds', () => {
  assert.deepEqual(
    JOINTPIC_SEARCH_LOG.slice(1, 8),
    [
      'QUERY from:{user1} min_faves:10000',
      'QUERY from:{user1} min_faves:5000',
      'QUERY from:{user1} min_faves:1000',
      'QUERY from:{user1} min_faves:500',
      'QUERY from:{user1} min_faves:100',
      'QUERY from:{user1} min_faves:10',
      'QUERY from:{user1} min_faves:1',
    ],
  );
  assert.deepEqual(
    JOINTPIC_SEARCH_LOG.slice(9, 16),
    [
      'QUERY from:{user2} min_faves:10000',
      'QUERY from:{user2} min_faves:5000',
      'QUERY from:{user2} min_faves:1000',
      'QUERY from:{user2} min_faves:500',
      'QUERY from:{user2} min_faves:100',
      'QUERY from:{user2} min_faves:10',
      'QUERY from:{user2} min_faves:1',
    ],
  );
});

test('joint pic and video render stages expose render log templates', () => {
  assert.ok(getSearchLog('jointpic', 'image').length > 0);
  assert.ok(getSearchLog('video', 'video').length > 0);
});

test('photo image stage uses render log messages', () => {
  const messages = getStatusMessages('photo', 'image');
  assert.ok(messages.some((message) => message.includes('PROMPT') || message.includes('RENDER')));
  assert.ok(getSearchLog('photo', 'image').length > 0);
});
