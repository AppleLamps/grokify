import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { mergeImaginePrompt } from '@/lib/merge-imagine-prompt';

const originalFetch = global.fetch;
const originalApiKey = process.env.XAI_API_KEY;

afterEach(() => {
  global.fetch = originalFetch;
  process.env.XAI_API_KEY = originalApiKey;
});

test('mergeImaginePrompt returns merged prompt text when xAI merge succeeds', async () => {
  process.env.XAI_API_KEY = 'xai-test';

  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: 'Merged prompt with scene preserved and watercolor applied.',
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )) as typeof fetch;

  const result = await mergeImaginePrompt({
    prompt: 'Satirical scene with a loud tech founder.',
    stylePrompt: 'Render the scene as a refined watercolor illustration.',
  });

  assert.equal(result.prompt, 'Merged prompt with scene preserved and watercolor applied.');
  assert.equal(result.usedFallback, false);
});

test('mergeImaginePrompt falls back to prepend merge when xAI returns empty content', async () => {
  process.env.XAI_API_KEY = 'xai-test';

  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '   ',
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )) as typeof fetch;

  const stylePrompt = 'Render the scene as polished anime key art.';
  const prompt = 'A founder standing on a pile of broken social icons.';

  const result = await mergeImaginePrompt({ prompt, stylePrompt });

  assert.equal(result.prompt, `${stylePrompt}\n\n${prompt}`);
  assert.equal(result.usedFallback, true);
});
