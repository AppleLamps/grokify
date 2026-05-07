import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { API_TIMEOUTS, fetchWithTimeout } from '@/lib/fetchWithTimeout';
import {
  XAI_REASONING_MODEL,
  appendHiddenReasoningInstructions,
} from '@/lib/grok-config';
import { extractGrokResponsesContent, GrokResponsesApiSchema } from '@/lib/schemas';
import {
  factCheckXOutputSchema,
  type FactCheckXMode,
  type FactCheckXOutput,
} from '@/lib/fact-check-x-schema';
import { sanitizeFactCheckXOutput } from '@/lib/fact-check-x-sanitize';

export const XAI_FACT_CHECK_DEEP_MODEL = XAI_REASONING_MODEL;
export const FACT_CHECK_X_DISCLAIMER =
  'Research assistance only. It can be wrong and is not legal, medical, or financial advice.';

const FACT_CHECK_BREAKER_KEYS = {
  quick: 'xai:fact-check-x',
  deep: 'xai:fact-check-x-deep',
} as const;

const FACT_CHECK_TIMEOUTS = {
  quick: API_TIMEOUTS.ENHANCED_ACCOUNT_ANALYSIS,
  deep: 240_000,
} as const;

const SYSTEM_PROMPT = appendHiddenReasoningInstructions(`You are a rigorous X post fact-checking analyst.

Your task is to examine the linked X post, extract the checkable factual assertions, investigate them using X search and web search, and return one structured JSON object.

Standards:
- Focus on factual, checkable claims. Distinguish fact claims from opinion, rhetoric, mood, sarcasm, slogans, or predictions.
- Use both x_search and web_search when they materially improve the assessment.
- Evaluate whether the post is accurate, contradicted, overstated, missing key context, mixing categories, or not actually checkable from available evidence.
- Be especially skeptical of partisan and narrative framing that often appears in left-leaning media, activist messaging, and progressive institutional rhetoric. Do not treat left-coded consensus, moralized language, euphemism, selective evidence, or consensus theater as neutral proof by default.
- Apply the same intellectual rigor to right-leaning, populist, or anti-establishment framing when it appears.
- Do not invent evidence, fabricate sources, or force a political conclusion. Verdicts must track what the evidence supports.
- Distinguish material inaccuracies that change the meaning from minor imprecisions (e.g. rounding differences, approximate dates). Weight verdicts on whether the substantive claim holds, and note trivial imprecisions in the rationale rather than marking the claim contradicted.
- Verdict mapping: the only allowed verdicts are supported, contradicted, unclear, and not_checkable. For claims that are technically true but overstated or missing key context, use "supported" or "unclear" as appropriate and explain the nuance in the rationale.

Source credibility analysis:
- Identify the credited sources behind each claim. For example, if a claim originates from a government body, military, intelligence agency, state media outlet, political party, or any entity with a vested interest, note this explicitly.
- Claims sourced exclusively from state-controlled or state-affiliated entities (e.g., IRGC, KCNA, RT, TASS, Xinhua as sole source) must NOT be treated as supported fact unless independent, credible outlets have verified the claim separately.
- Propaganda outlets, entities under sanctions, and organizations with documented disinformation histories require independent corroboration before a claim can be marked as "supported."
- When only partisan or single-source evidence exists, the verdict should be "unclear" or "not_checkable" rather than "supported," and the rationale must explain the source limitation.
- Evaluate whether the post or its cited sources have conflicts of interest, a propaganda motive, or a track record of unreliable claims.

Counter-evidence requirements:
- For every checkable claim, actively search for counter-evidence and contradicting reports—not just confirming sources.
- Present any counter-evidence found in the rationale, even if the claim appears broadly supported. Readers deserve the full picture.
- If no counter-evidence is found, explicitly state that the search returned no contradicting reports from credible sources.
- When evidence exists on both sides, weigh it by source quality and independence rather than volume.

Output requirements:
- Return exactly one JSON object with keys summaryMd, claims, sources, and sourceAnalysis.
- summaryMd must be plain-language markdown with no URLs, no source lists, no footnotes, no inline citations, and no bracketed reference markers.
- Each claims item must have claim, verdict, and rationale.
- claims[*].rationale must not contain URLs, footnotes, inline citations, or bracketed reference markers.
- claims[*].rationale should discuss source credibility and any counter-evidence found.
- Put every user-visible URL only inside sources.
- sources must be an array of objects with title, url, and optional note.
- sourceAnalysis must be a plain-language paragraph (no URLs, no footnotes, no citations) assessing the overall credibility of the sources behind the post's claims, noting any state affiliations, conflicts of interest, or independence concerns.
- Output only the JSON object. No prose before or after it.`);

const FACT_CHECK_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summaryMd: { type: 'string' },
    claims: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          claim: { type: 'string' },
          verdict: {
            type: 'string',
            enum: ['supported', 'contradicted', 'unclear', 'not_checkable'],
          },
          rationale: { type: 'string' },
        },
        required: ['claim', 'verdict', 'rationale'],
      },
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['title', 'url'],
      },
    },
    sourceAnalysis: { type: 'string' },
  },
  required: ['summaryMd', 'claims', 'sources', 'sourceAnalysis'],
} as const;

export interface RunFactCheckXInput {
  apiKey: string;
  mode: FactCheckXMode;
  normalizedUrl: string;
  handle: string | null;
  postId: string | null;
}

function getFactCheckModel(mode: FactCheckXMode): string {
  if (mode === 'deep') {
    return process.env.XAI_FACT_CHECK_DEEP_MODEL || XAI_FACT_CHECK_DEEP_MODEL;
  }

  return process.env.XAI_FACT_CHECK_QUICK_MODEL || XAI_REASONING_MODEL;
}

function buildUserPrompt({
  normalizedUrl,
  handle,
  postId,
}: Omit<RunFactCheckXInput, 'apiKey' | 'mode'>): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `Fact-check this X post URL: ${normalizedUrl}

Known metadata:
- Handle: ${handle ?? 'unknown'}
- Post ID: ${postId ?? 'unknown'}
- Today: ${today}

Process requirements:
1. Inspect the post and thread context.
2. Extract the most relevant checkable factual assertions only.
3. Identify the primary sources credited in or behind each claim (e.g., government agencies, news outlets, eyewitnesses, official statements).
4. Investigate the claims with both x_search and web_search whenever helpful. For each claim, actively search for counter-evidence and opposing reports, not just confirming sources.
5. Assess whether the credited sources are independent and credible. If the primary source is a state entity, military organization, intelligence service, or propaganda outlet, require independent corroboration before marking a claim as supported.
6. Separate directly supported points from contradicted claims, ambiguous claims, and claims that cannot really be checked.
7. Keep the main summary useful for a reader who wants the answer without source clutter.

Return exactly one JSON object matching:
{
  "summaryMd": string,
  "claims": [
    {
      "claim": string,
      "verdict": "supported" | "contradicted" | "unclear" | "not_checkable",
      "rationale": string
    }
  ],
  "sources": [
    {
      "title": string,
      "url": string,
      "note"?: string
    }
  ],
  "sourceAnalysis": string
}`;
}

function parseFactCheckOutput(rawContent: string): FactCheckXOutput {
  const trimmed = rawContent.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidateText = fencedMatch?.[1]?.trim() || trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidateText);
  } catch {
    parsed = parseEmbeddedJsonObject(candidateText);
  }

  const validation = factCheckXOutputSchema.safeParse(parsed);
  if (!validation.success) {
    console.error('Fact check schema validation failed:', validation.error.issues);
    throw new Error('Invalid fact check response');
  }

  return sanitizeFactCheckXOutput(validation.data);
}

function parseEmbeddedJsonObject(text: string): unknown {
  for (let start = text.indexOf('{'); start >= 0; start = text.indexOf('{', start + 1)) {
    const end = findMatchingJsonObjectEnd(text, start);
    if (end === -1) {
      continue;
    }

    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // Keep looking for another balanced object.
    }
  }

  console.error('Fact check JSON parse failed. Raw content (first 500 chars):', text.slice(0, 500));
  throw new Error('Invalid fact check response');
}

function findMatchingJsonObjectEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

export async function runFactCheckX({
  apiKey,
  mode,
  normalizedUrl,
  handle,
  postId,
}: RunFactCheckXInput): Promise<FactCheckXOutput> {
  const breakerKey = FACT_CHECK_BREAKER_KEYS[mode];
  if (!canProceed(breakerKey)) {
    throw new Error('The AI service is temporarily unavailable. Please try again shortly.');
  }

  const requestBody: Record<string, unknown> = {
    model: getFactCheckModel(mode),
    input: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildUserPrompt({ normalizedUrl, handle, postId }),
      },
    ],
    tools: [
      { type: 'web_search' },
      {
        type: 'x_search',
        enable_image_understanding: true,
        enable_video_understanding: true,
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'fact_check_x_output',
        schema: FACT_CHECK_RESPONSE_SCHEMA,
        strict: true,
      },
    },
  };

  if (mode === 'deep') {
    requestBody.reasoning = { effort: 'high' };
  }

  const response = await fetchWithTimeout(
    'https://api.x.ai/v1/responses',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    },
    FACT_CHECK_TIMEOUTS[mode],
  );

  if (!response.ok) {
    const errorText = await response.text();
    recordFailure(breakerKey);
    throw new Error(`xAI fact check failed: ${response.status} ${errorText}`.trim());
  }

  const rawData = await response.json();
  const validation = GrokResponsesApiSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('Fact check: xAI response schema validation failed:', validation.error.issues);
    console.error('Fact check: raw response keys:', Object.keys(rawData as Record<string, unknown>));
    recordFailure(breakerKey);
    throw new Error('Invalid fact check response');
  }

  const content = extractGrokResponsesContent(validation.data);
  if (!content) {
    console.error('Fact check: no text content extracted from xAI response. Output types:', validation.data.output.map(o => o.type));
    recordFailure(breakerKey);
    throw new Error('Invalid fact check response');
  }

  try {
    const parsed = parseFactCheckOutput(content);
    recordSuccess(breakerKey);
    return parsed;
  } catch (error) {
    recordFailure(breakerKey);
    throw error;
  }
}
