import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeFactCheckXOutput,
  type FactCheckXOutput,
} from '@/lib/fact-check-x-sanitize';

test('sanitizeFactCheckXOutput strips links and citation markers from display copy while preserving and deduping sources', () => {
  const input: FactCheckXOutput = {
    summaryMd:
      'The post claims a [major scandal](https://example.com/story) happened [1] and points readers to https://news.example.com/article for proof.',
    claims: [
      {
        claim: 'The post says the event happened yesterday.',
        verdict: 'unclear',
        rationale:
          'The claim is not directly supported by the post and the linked writeup says otherwise [2](https://example.com/evidence).',
      },
    ],
    sources: [
      {
        title: 'Primary report',
        url: 'https://example.com/story',
        note: 'Used for context',
      },
      {
        title: 'Primary report copy',
        url: 'https://example.com/story',
        note: 'Duplicate URL should be removed',
      },
      {
        title: 'Evidence page',
        url: 'https://example.com/evidence',
      },
    ],
  };

  const result = sanitizeFactCheckXOutput(input);

  assert.equal(
    result.summaryMd,
    'The post claims a major scandal happened and points readers to for proof.',
  );
  assert.equal(
    result.claims[0]?.rationale,
    'The claim is not directly supported by the post and the linked writeup says otherwise .',
  );
  assert.deepEqual(result.sources, [
    {
      title: 'Primary report',
      url: 'https://example.com/story',
      note: 'Used for context',
    },
    {
      title: 'Evidence page',
      url: 'https://example.com/evidence',
    },
  ]);
});

test('sanitizeFactCheckXOutput strips links and citations from sourceAnalysis', () => {
  const input: FactCheckXOutput = {
    summaryMd: 'Clean summary.',
    claims: [],
    sources: [],
    sourceAnalysis:
      'The primary source is [IRGC media](https://example.com/irgc) [1]. No independent outlet has confirmed this. See https://example.com/details for more.',
  };

  const result = sanitizeFactCheckXOutput(input);

  assert.equal(
    result.sourceAnalysis,
    'The primary source is IRGC media . No independent outlet has confirmed this. See for more.',
  );
});

test('sanitizeFactCheckXOutput omits sourceAnalysis when not provided', () => {
  const input: FactCheckXOutput = {
    summaryMd: 'Summary text.',
    claims: [],
    sources: [],
  };

  const result = sanitizeFactCheckXOutput(input);
  assert.equal(result.sourceAnalysis, undefined);
});
