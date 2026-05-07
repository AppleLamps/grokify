import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HIDDEN_REASONING_INSTRUCTIONS,
  OPENROUTER_REASONING_MODEL,
  XAI_REASONING_MODEL,
  appendHiddenReasoningInstructions,
} from '@/lib/grok-config';

test('XAI Grok model is pinned to the direct xAI reasoning model', () => {
  assert.equal(XAI_REASONING_MODEL, 'grok-4.3');
});

test('OpenRouter prompt model is pinned to Grok 4.3', () => {
  assert.equal(OPENROUTER_REASONING_MODEL, 'x-ai/grok-4.3');
});

test('appendHiddenReasoningInstructions preserves the base prompt and suppresses reasoning output', () => {
  const basePrompt = 'Return only the final answer.';
  const result = appendHiddenReasoningInstructions(basePrompt);

  assert.match(result, /Return only the final answer\./);
  assert.match(result, /reason privately/i);
  assert.match(result, /Do not reveal your reasoning/i);
  assert.match(result, /requested final answer or structured output/i);
});

test('hidden reasoning instructions stay synchronized with the prompt helper', () => {
  const result = appendHiddenReasoningInstructions('Base prompt');

  assert.match(result, new RegExp(HIDDEN_REASONING_INSTRUCTIONS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
