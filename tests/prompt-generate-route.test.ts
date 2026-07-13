import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/prompt-generate/route';

const originalFetch = global.fetch;
const originalXaiApiKey = process.env.XAI_API_KEY;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  global.fetch = originalFetch;

  if (originalXaiApiKey === undefined) {
    delete process.env.XAI_API_KEY;
  } else {
    process.env.XAI_API_KEY = originalXaiApiKey;
  }

  if (originalAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});

test('POST /api/prompt-generate requires XAI_API_KEY', async () => {
  delete process.env.XAI_API_KEY;

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

test('POST /api/prompt-generate sends the direct xAI Grok 4.5 request shape', async () => {
  let capturedUrl = '';
  let capturedHeaders: Headers | undefined;
  let capturedBody:
    | {
        model?: unknown;
        response_format?: {
          type?: unknown;
          json_schema?: {
            strict?: unknown;
            name?: unknown;
          };
        };
      }
    | undefined;

  process.env.XAI_API_KEY = 'xai-test';
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
  assert.equal(capturedUrl, 'https://api.x.ai/v1/chat/completions');
  assert.equal(capturedHeaders?.get('authorization'), 'Bearer xai-test');
  assert.equal(capturedHeaders?.get('http-referer'), null);
  assert.equal(capturedHeaders?.get('x-title'), null);
  assert.ok(capturedBody);
  assert.equal(capturedBody.model, 'grok-4.5-latest');
  assert.equal(capturedBody.response_format?.type, 'json_schema');
  assert.equal(capturedBody.response_format?.json_schema?.name, 'prompt_response');
  assert.equal(capturedBody.response_format?.json_schema?.strict, true);
});
