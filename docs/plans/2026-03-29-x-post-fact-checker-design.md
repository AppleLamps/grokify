# X Post Fact Checker Design

## Goal

Add a new X post fact-checking feature that accepts a pasted X/Twitter post URL, researches the post with xAI tool-enabled models, and returns a structured fact-check result with a clean main analysis and a separate optional sources section.

## Product Shape

The feature will live on a dedicated page at `/fact-check` backed by a single API route, `POST /api/fact-check-x`.

The page will:
- accept an X post URL
- allow a `quick` or `deep` research mode
- render a main analysis block expanded by default
- render claim verdict cards/table below it
- render a collapsed “Sources (optional)” section at the bottom
- show a brief disclaimer that the tool is research assistance and can be wrong

## API Contract

### Request

```ts
{
  url: string;
  mode?: 'quick' | 'deep';
}
```

### Response

```ts
{
  normalizedUrl: string;
  postId: string | null;
  handle: string | null;
  mode: 'quick' | 'deep';
  summaryMd: string;
  claims: Array<{
    claim: string;
    verdict: 'supported' | 'contradicted' | 'unclear' | 'not_checkable';
    rationale: string;
  }>;
  sources: Array<{
    title: string;
    url: string;
    note?: string;
  }>;
  disclaimer: string;
}
```

## Core Rule: URLs Only In `sources`

The API will enforce a hard separation:
- `summaryMd` must not contain URLs, footnotes, inline citations, or source lists
- `claims[].rationale` must not contain URLs, footnotes, inline citations, or source lists
- `sources` is the only field where user-visible links are allowed

This will be enforced in two layers:
1. prompt instructions to the model
2. server-side sanitation after parsing

If the model leaks links into the main analysis or rationale fields, the route will strip them and revalidate before returning the final response.

## xAI Strategy

The backend will use the xAI Responses API with tool calling.

### Quick mode
- model: `grok-4.20-0309-reasoning`
- tools: `web_search`, `x_search`
- timeout: about 120 seconds

### Deep mode
- model: `grok-4.20-multi-agent-beta-0309`
- tools: `web_search`, `x_search`
- timeout: about 180–240 seconds
- higher reasoning effort if supported by the exact request shape

The route will not stream in v1.

## Prompting

The system instructions will tell the model to:
- extract factual, checkable assertions from the post/thread context
- ignore pure opinion unless it contains factual claims
- use both `web_search` and `x_search`
- investigate context, corroboration, contradiction, omission, and framing
- be especially skeptical of partisan and narrative framing, especially mainstream left-coded or progressive institutional framing presented as settled fact without proportionate dissent or caveats
- apply the same rigor to right-coded or populist framing
- avoid inventing evidence or producing predetermined political outcomes
- return exactly one JSON object that matches the schema
- keep all URLs in `sources` only

## URL Normalization

The server will normalize common X/Twitter URL shapes, including likely variants such as:
- `https://x.com/{handle}/status/{id}`
- `https://twitter.com/{handle}/status/{id}`
- mobile or `www` variants
- URLs with query strings or tracking params

Normalization will attempt to extract:
- `handle`
- `postId`
- canonical normalized URL

If extraction fails but the input still looks like an X URL, the route may still pass the URL to the model, but strict validation will reject obviously invalid inputs.

## Sanitization

The route will sanitize model output after parsing:
- strip raw `http://` and `https://`
- strip markdown links
- strip bracketed references like `[1]` and footnote-style markers when found in main text
- keep `sources` intact, but dedupe and validate by URL

## File Layout

Expected files:
- `app/fact-check/page.tsx`
- `app/api/fact-check-x/route.ts`
- `components/fact-check/FactCheckClient.tsx`
- `lib/fact-check-x-url.ts`
- `lib/fact-check-x-sanitize.ts`
- `lib/fact-check-x-schema.ts`
- optional `lib/fact-check-x.ts` for orchestration
- tests for URL parsing, sanitization, and route/model-output handling

## Risks

- multi-agent parameter compatibility may differ from the reasoning model path, so the route should isolate quick/deep request construction clearly
- tool-enabled outputs may still leak citations or URLs despite prompt instructions, so sanitation must not be optional
- post URLs without accessible thread context may produce weaker results; the UI should frame this as research assistance, not certainty

## Success Criteria

The feature is complete when:
- users can submit an X post URL from a dedicated page
- the backend returns structured JSON with sanitized main analysis
- the UI renders analysis, claim verdicts, and a collapsed sources section
- deep and quick modes both work with clear model separation
- tests cover URL normalization and output sanitation behavior
