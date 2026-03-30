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

export const XAI_FACT_CHECK_DEEP_MODEL = 'grok-4.20-multi-agent';
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

Output requirements:
- Return exactly one JSON object with keys summaryMd, claims, and sources.
- summaryMd must be plain-language markdown with no URLs, no source lists, no footnotes, no inline citations, and no bracketed reference markers.
- Each claims item must have claim, verdict, and rationale.
- claims[*].rationale must not contain URLs, footnotes, inline citations, or bracketed reference markers.
- Put every user-visible URL only inside sources.
- sources must be an array of objects with title, url, and optional note.
- Output only the JSON object. No prose before or after it.`);

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
3. Investigate the claims with both x_search and web_search whenever helpful.
4. Separate directly supported points from contradicted claims, ambiguous claims, and claims that cannot really be checked.
5. Keep the main summary useful for a reader who wants the answer without source clutter.

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
  ]
}`;
}

function parseFactCheckOutput(rawContent: string): FactCheckXOutput {
  const trimmed = rawContent.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch?.[1]?.trim() || trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid fact check response');
  }

  const validation = factCheckXOutputSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error('Invalid fact check response');
  }

  return sanitizeFactCheckXOutput(validation.data);
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
        ...(handle ? { allowed_x_handles: [handle] } : {}),
        enable_image_understanding: true,
        enable_video_understanding: true,
      },
    ],
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
    recordFailure(breakerKey);
    throw new Error('Invalid fact check response');
  }

  const content = extractGrokResponsesContent(validation.data);
  if (!content) {
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
