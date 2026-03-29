import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import { XAI_REASONING_MODEL } from '@/lib/grok-config';
import { GrokResponseSchema, extractGrokContent } from '@/lib/schemas';

const MERGE_BREAKER_KEY = 'xai:imagine-prompt-merge';

const MERGE_SYSTEM_PROMPT = `You merge two inputs into ONE final prompt for an image generation model (Grok Imagine).

Input A is a scene/content description (subjects, jokes, satire, composition).
Input B is a visual treatment directive (medium, palette, lighting, rendering style).

Rules:
- Preserve the scene, characters, gags, and specific details from A.
- Enforce the visual look from B so the final image clearly matches that treatment.
- Remove or rewrite any part of A that contradicts B (e.g. if A demands thick comic outlines but B asks watercolor, prioritize B’s look while keeping A’s content).
- Do not add new subjects or unrelated jokes; do not add meta commentary.
- Output a single fluent paragraph (or tight multi-sentence block), 500–1200 characters if possible, suitable as the sole \`prompt\` field for image generation.
- Output ONLY the final prompt text. No labels, no markdown, no explanations.`;

interface MergeImaginePromptInput {
  prompt: string;
  stylePrompt: string;
}

interface MergeImaginePromptResult {
  prompt: string;
  usedFallback: boolean;
}

function buildFallbackPrompt(prompt: string, stylePrompt: string): string {
  return `${stylePrompt}\n\n${prompt}`;
}

export async function mergeImaginePrompt({
  prompt,
  stylePrompt,
}: MergeImaginePromptInput): Promise<MergeImaginePromptResult> {
  const fallbackPrompt = buildFallbackPrompt(prompt, stylePrompt);
  const xaiApiKey = process.env.XAI_API_KEY;

  if (!xaiApiKey || !canProceed(MERGE_BREAKER_KEY)) {
    return { prompt: fallbackPrompt, usedFallback: true };
  }

  try {
    const response = await fetchWithTimeout(
      'https://api.x.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.XAI_PROMPT_MERGE_MODEL || XAI_REASONING_MODEL,
          messages: [
            { role: 'system', content: MERGE_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Input A (scene/content):
<<<${prompt}>>>

Input B (visual treatment):
<<<${stylePrompt}>>>

Produce the single merged image prompt.`,
            },
          ],
        }),
      },
      API_TIMEOUTS.GROK_ANALYSIS
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagine prompt merge failed:', response.status, errorText.substring(0, 300));
      recordFailure(MERGE_BREAKER_KEY);
      return { prompt: fallbackPrompt, usedFallback: true };
    }

    const rawData = await response.json();
    const validationResult = GrokResponseSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error('Invalid imagine prompt merge response:', validationResult.error);
      recordFailure(MERGE_BREAKER_KEY);
      return { prompt: fallbackPrompt, usedFallback: true };
    }

    const mergedPrompt = extractGrokContent(validationResult.data).trim();
    if (!mergedPrompt) {
      recordFailure(MERGE_BREAKER_KEY);
      return { prompt: fallbackPrompt, usedFallback: true };
    }

    recordSuccess(MERGE_BREAKER_KEY);
    return { prompt: mergedPrompt, usedFallback: false };
  } catch (error) {
    console.error('Imagine prompt merge error:', error);
    recordFailure(MERGE_BREAKER_KEY);
    return { prompt: fallbackPrompt, usedFallback: true };
  }
}
