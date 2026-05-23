import test from 'node:test';
import assert from 'node:assert/strict';

import { getApiErrorMessage } from '@/lib/api-error';

test('getApiErrorMessage returns string errors unchanged', () => {
  assert.equal(getApiErrorMessage('Rate limited', 'Fallback'), 'Rate limited');
});

test('getApiErrorMessage extracts message from error objects', () => {
  assert.equal(
    getApiErrorMessage({ code: '404', message: 'Not Found' }, 'Fallback'),
    'Not Found',
  );
});

test('getApiErrorMessage falls back when error is unusable', () => {
  assert.equal(getApiErrorMessage({ code: '404' }, 'Fallback'), 'Fallback');
  assert.equal(getApiErrorMessage(null, 'Fallback'), 'Fallback');
});
