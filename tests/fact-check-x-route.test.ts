import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/fact-check-x/route';

const originalFetch = global.fetch;
const originalApiKey = process.env.XAI_API_KEY;

afterEach(() => {
  global.fetch = originalFetch;

  if (originalApiKey === undefined) {
    delete process.env.XAI_API_KEY;
  } else {
    process.env.XAI_API_KEY = originalApiKey;
  }
});

function createResponsesPayload(text: string) {
  return {
    output: [
      {
        type: 'message',
        content: [
          {
            type: 'output_text',
            text,
          },
        ],
      },
    ],
  };
}

test('POST /api/fact-check-x rejects invalid X post URLs', async () => {
  process.env.XAI_API_KEY = 'test-key';

  const request = new NextRequest('http://localhost/api/fact-check-x', {
    method: 'POST',
    body: JSON.stringify({ url: 'https://example.com/not-an-x-post' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await POST(request);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'Invalid X post URL');
});

test('POST /api/fact-check-x returns the structured fact-check payload', async () => {
  process.env.XAI_API_KEY = 'test-key';

  global.fetch = async () =>
    new Response(
      JSON.stringify(
        createResponsesPayload(
          JSON.stringify({
            summaryMd: 'The post compresses a more complicated story into a cleaner narrative than the evidence supports.',
            claims: [
              {
                claim: 'The post says the bill was passed yesterday.',
                verdict: 'contradicted',
                rationale: 'The legislative record shows the vote happened earlier.',
              },
            ],
            sources: [
              {
                title: 'Legislative record',
                url: 'https://example.com/legislative-record',
              },
            ],
          }),
        ),
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  const request = new NextRequest('http://localhost/api/fact-check-x', {
    method: 'POST',
    body: JSON.stringify({
      url: 'https://twitter.com/example/status/1234567890?ref_src=twsrc%5Etfw',
      mode: 'quick',
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await POST(request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.normalizedUrl, 'https://x.com/example/status/1234567890');
  assert.equal(payload.handle, 'example');
  assert.equal(payload.postId, '1234567890');
  assert.equal(payload.mode, 'quick');
  assert.equal(
    payload.summaryMd,
    'The post compresses a more complicated story into a cleaner narrative than the evidence supports.',
  );
  assert.equal(typeof payload.disclaimer, 'string');
});
