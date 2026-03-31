import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { runFactCheckX } from '@/lib/fact-check-x';
import { XAI_REASONING_MODEL } from '@/lib/grok-config';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.XAI_FACT_CHECK_DEEP_MODEL;
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

test('runFactCheckX uses the standard reasoning model and both server-side search tools in quick mode', async () => {
  let capturedBody:
    | {
        model?: unknown;
        tools?: unknown;
        reasoning?: unknown;
      }
    | undefined;

  global.fetch = async (_input, init) => {
    capturedBody = JSON.parse(String(init?.body ?? '{}'));
    return new Response(
      JSON.stringify(
        createResponsesPayload(
          JSON.stringify({
            summaryMd: 'The claim is partly supported but missing important context.',
            claims: [
              {
                claim: 'The post says a policy change happened this week.',
                verdict: 'unclear',
                rationale: 'Available reporting is mixed and the timeline is disputed.',
              },
            ],
            sources: [
              {
                title: 'Reference',
                url: 'https://example.com/reference',
              },
            ],
          }),
        ),
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const result = await runFactCheckX({
    apiKey: 'test-key',
    mode: 'quick',
    normalizedUrl: 'https://x.com/example/status/123',
    handle: 'example',
    postId: '123',
  });

  assert.equal(result.summaryMd, 'The claim is partly supported but missing important context.');
  assert.ok(capturedBody);
  assert.equal(capturedBody.model, XAI_REASONING_MODEL);
  assert.deepEqual(capturedBody.tools, [
    { type: 'web_search' },
    {
      type: 'x_search',
      enable_image_understanding: true,
      enable_video_understanding: true,
    },
  ]);
  assert.equal(capturedBody.reasoning, undefined);
});

test('runFactCheckX uses reasoning model with deep reasoning effort in deep mode', async () => {
  let capturedBody:
    | {
        model?: unknown;
        tools?: unknown;
        reasoning?: unknown;
      }
    | undefined;

  global.fetch = async (_input, init) => {
    capturedBody = JSON.parse(String(init?.body ?? '{}'));
    return new Response(
      JSON.stringify(
        createResponsesPayload(
          JSON.stringify({
            summaryMd: 'Independent reporting largely contradicts the post.',
            claims: [],
            sources: [],
          }),
        ),
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  await runFactCheckX({
    apiKey: 'test-key',
    mode: 'deep',
    normalizedUrl: 'https://x.com/example/status/123',
    handle: 'example',
    postId: '123',
  });

  assert.ok(capturedBody);
  assert.equal(capturedBody.model, XAI_REASONING_MODEL);
  assert.deepEqual(capturedBody.reasoning, { effort: 'high' });
  assert.deepEqual(capturedBody.tools, [
    { type: 'web_search' },
    {
      type: 'x_search',
      enable_image_understanding: true,
      enable_video_understanding: true,
    },
  ]);
});

test('runFactCheckX rejects malformed model output', async () => {
  global.fetch = async () =>
    new Response(
      JSON.stringify(createResponsesPayload('not valid json')),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  await assert.rejects(
    () =>
      runFactCheckX({
        apiKey: 'test-key',
        mode: 'quick',
        normalizedUrl: 'https://x.com/example/status/123',
        handle: 'example',
        postId: '123',
      }),
    /Invalid fact check response/,
  );
});
