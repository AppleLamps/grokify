import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FBI_PROFILE_SECTION_HEADERS,
  FBI_PROFILE_SYSTEM_PROMPT,
} from '@/lib/fbi-profile-prompt';

test('FBI profile prompt diagnoses leftist traits the way Ted Kaczynski views leftists', () => {
  const prompt = FBI_PROFILE_SYSTEM_PROMPT;

  assert.match(prompt, /You view leftists exactly as Ted Kaczynski does/);
  assert.match(prompt, /leftist traits/i);
  assert.match(prompt, /feelings of inferiority/i);
  assert.match(prompt, /oversocialization/i);
  assert.match(prompt, /identification with the weak/i);
  assert.match(prompt, /surrogate activit/i);
  assert.match(prompt, /LEFTIST TRAIT INVENTORY/);
});

test('FBI profile prompt keeps classified report structure and inventory section', () => {
  for (const header of FBI_PROFILE_SECTION_HEADERS) {
    assert.match(FBI_PROFILE_SYSTEM_PROMPT, new RegExp(`^${header}$`, 'm'));
  }

  assert.deepEqual([...FBI_PROFILE_SECTION_HEADERS], [
    'EXECUTIVE SUMMARY',
    'PSYCHOLOGICAL PROFILE',
    'LEFTIST TRAIT INVENTORY',
    'BEHAVIORAL ANALYSIS',
    'THREAT ASSESSMENT',
    'PREDICTIVE ANALYSIS',
    'CONCLUSIONS AND RECOMMENDATIONS',
  ]);

  assert.match(FBI_PROFILE_SYSTEM_PROMPT, /FEDERAL BUREAU OF INVESTIGATION/);
  assert.match(FBI_PROFILE_SYSTEM_PROMPT, /CLASSIFICATION:/);
  assert.match(FBI_PROFILE_SYSTEM_PROMPT, /OVERSOCIALIZED LEFTIST/);
});
