import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSearchLog,
  getStatusMessages,
  interpolateLogTemplate,
} from '@/lib/loading-overlay-copy';

test('photo analyze exposes X search log templates', () => {
  const log = getSearchLog('photo', 'analyze');
  assert.ok(log.some((entry) => entry.includes('from:{user}')));
});

test('interpolateLogTemplate replaces subject placeholders', () => {
  assert.equal(
    interpolateLogTemplate('QUERY from:{user} min_faves:100', 'elonmusk'),
    'QUERY from:elonmusk min_faves:100',
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
