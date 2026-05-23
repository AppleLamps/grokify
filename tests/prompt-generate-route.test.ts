import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/prompt-generate/route';

const originalFetch = global.fetch;
const originalOpenRouterApiKey = process.env.OPENROUTER_API_KEY;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  global.fetch = originalFetch;

  if (originalOpenRouterApiKey === undefined) {
    delete process.env.OPENROUTER_API_KEY;
  } else {
    process.env.OPENROUTER_API_KEY = originalOpenRouterApiKey;
  }

  if (originalAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});

test('POST /api/prompt-generate requires OPENROUTER_API_KEY', async () => {
  delete process.env.OPENROUTER_API_KEY;

  const request = new NextRequest('http://localhost/api/prompt-generate', {
    method: 'POST',
    body: JSON.stringify({ idea: 'A neon-lit city garden' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await POST(request);
  const payload = await response.json();

  assert.equal(response.status, 500);
  assert.equal(payload.error, 'API key is not configured. Please contact the administrator.');
});

test('POST /api/prompt-generate sends the Grok 4.3 OpenRouter request shape', async () => {
  let capturedUrl = '';
  let capturedHeaders: Headers | undefined;
  let capturedBody:
    | {
        model?: unknown;
        provider?: unknown;
        response_format?: {
          type?: unknown;
          json_schema?: {
            strict?: unknown;
            name?: unknown;
          };
        };
      }
    | undefined;

  process.env.OPENROUTER_API_KEY = 'sk-or-test';
  process.env.NEXT_PUBLIC_APP_URL = 'https://www.grokify.com';

  global.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedHeaders = new Headers(init?.headers);
    capturedBody = JSON.parse(String(init?.body ?? '{}'));

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                prompt: 'A polished cinematic prompt with crisp visual intent.',
              }),
            },
          },
        ],
        usage: { total_tokens: 42 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const request = new NextRequest('http://localhost/api/prompt-generate', {
    method: 'POST',
    body: JSON.stringify({ idea: 'A neon-lit city garden' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await POST(request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.prompt, 'A polished cinematic prompt with crisp visual intent.');
  assert.equal(capturedUrl, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(capturedHeaders?.get('authorization'), 'Bearer sk-or-test');
  assert.equal(capturedHeaders?.get('http-referer'), 'https://www.grokify.com');
  assert.equal(capturedHeaders?.get('x-title'), 'Grokify Prompt Generator');
  assert.ok(capturedBody);
  assert.equal(capturedBody.model, 'x-ai/grok-4.3');
  assert.deepEqual(capturedBody.provider, { require_parameters: true });
  assert.equal(capturedBody.response_format?.type, 'json_schema');
  assert.equal(capturedBody.response_format?.json_schema?.name, 'prompt_response');
  assert.equal(capturedBody.response_format?.json_schema?.strict, true);
});
