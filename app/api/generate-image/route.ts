import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import {
  GeminiImageResponseSchema,
  GrokResponseSchema,
  extractGeminiImage,
  extractGrokContent,
  getCorsHeaders,
} from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { STYLE_PROMPTS, getStylePrompt } from '@/lib/style-prompts';
import { SITE_URL } from '@/lib/site';
import { canLogAiPayloads, serverLogger } from '@/lib/server-logger';
import { XAI_REASONING_MODEL } from '@/lib/grok-config';

// Image model
const IMAGE_MODEL = 'google/gemini-3-pro-image-preview';

// Enhanced prompt wrapper - incorporates style and prevents text misspellings
const enhancePrompt = (basePrompt: string, style: string = 'default'): string => {
  const stylePrompt = getStylePrompt(style);

  return `${stylePrompt}

CRITICAL TEXT RENDERING RULES:
- If any text, labels, signs, or words appear in the image, spell them EXACTLY and CORRECTLY
- Double-check all spelling before rendering any text
- Prefer using symbols, icons, and visual metaphors over text when possible
- If text is essential, keep it minimal and simple (1-3 words maximum per element)
- Common words that must be spelled correctly: "BREAKING", "NEWS", "FREE", "SALE", "HELP", "STOP", "GO", "YES", "NO"

SCENE TO ILLUSTRATE:
${basePrompt}

Remember: NO MISSPELLINGS in any text. When in doubt, use visual symbols instead of words.`;
};

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [500, 1500, 3000];

// Check if an error is a retryable network error (socket closed, connection reset, etc.)
const isRetryableNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return message.includes('terminated') || message.includes('aborted') || message.includes('network');
  }
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: Error }).cause;
    if (cause?.message?.toLowerCase().includes('socket')) return true;
  }
  return false;
};

const fetchWithRetry = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs);

      if (response.ok || !RETRYABLE_STATUS.has(response.status)) {
        return response;
      }

      serverLogger.warn('Retryable OpenRouter HTTP status', { status: response.status, attempt: attempt + 1 });
    } catch (error) {
      // Retry on network errors (socket closed, terminated, etc.)
      if (isRetryableNetworkError(error)) {
        serverLogger.warn('Retryable OpenRouter network error', { attempt: attempt + 1, error });
        lastError = error instanceof Error ? error : new Error(String(error));
      } else {
        throw error;
      }
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }

  // If we exhausted retries due to network errors, throw the last error
  if (lastError) {
    throw lastError;
  }

  return fetchWithTimeout(url, init, timeoutMs);
};

// Generate a safer prompt using Grok directly (avoids self-referential API call issues in serverless)
const generateSaferPromptWithGrok = async (handle: string, originalPrompt: string): Promise<string> => {
  const breakerKey = 'xai:safety-rewrite';
  if (!canProceed(breakerKey)) {
    throw new Error('Safety rewrite service is temporarily unavailable');
  }

  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) {
    throw new Error('XAI_API_KEY is not configured for safety rewrite');
  }

  serverLogger.info('Generating safer prompt with Grok', { handle });

  const safetySystemPrompt = `You are an expert at rewriting image generation prompts to be safer while maintaining their essence and humor.

Your task: Take the original prompt and rewrite it to avoid content that might trigger AI image safety filters, while still capturing the same spirit, personality, and satirical nature.

Guidelines for safer prompts:
- **Use Visual Metaphors:** Replace any potentially controversial elements with symbolic representations
- **Avoid Political Figures Directly:** Instead of depicting specific politicians, use symbolic representations (e.g., "a figure representing conservative values" → "an elephant mascot in a suit")
- **No Violence or Weapons:** Replace with harmless cartoon alternatives (e.g., "wielding a sword" → "wielding an oversized foam finger")
- **Abstract Controversial Topics:** Use visual symbolism rather than explicit depictions
- **Keep the Humor:** The satire should still be evident through clever visual choices
- **Maintain the Art Style:** Keep the MAD Magazine / satirical cartoon aesthetic

Output ONLY the rewritten prompt. No explanations, no preamble.`;

  const response = await fetchWithTimeout(
    'https://api.x.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: XAI_REASONING_MODEL,
        messages: [
          { role: 'system', content: safetySystemPrompt },
          {
            role: 'user',
            content: `Original prompt that was blocked by safety filters:\n\n"${originalPrompt}"\n\nRewrite this to be safer while keeping the satirical spirit and visual humor for @${handle}'s account.`,
          },
        ],
      }),
    },
    API_TIMEOUTS.GROK_ANALYSIS
  );

  if (!response.ok) {
    const errorText = await response.text();
    serverLogger.error('xAI API error for safety rewrite', {
      status: response.status,
      upstreamBytes: errorText.length,
    });
    recordFailure(breakerKey);
    throw new Error(`Failed to generate safer prompt: ${response.status}`);
  }

  const rawData = await response.json();
  const validationResult = GrokResponseSchema.safeParse(rawData);

  if (!validationResult.success) {
    serverLogger.error('Invalid Grok response for safety rewrite', { error: validationResult.error });
    recordFailure(breakerKey);
    throw new Error('Invalid response from Grok API');
  }

  const saferPrompt = extractGrokContent(validationResult.data);
  if (!saferPrompt) {
    recordFailure(breakerKey);
    throw new Error('No content in Grok safety rewrite response');
  }

  recordSuccess(breakerKey);
  serverLogger.info('Generated safer prompt', { promptChars: saferPrompt.length });
  return saferPrompt;
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: getCorsHeaders() });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders();

  try {
    const { prompt, handle, style } = await req.json();

    // Validate handle format - allows single handles (1-15 chars) or combined handles for joint pics (up to 31 chars: handle1_handle2)
    const HANDLE_REGEX = /^[a-zA-Z0-9_]{1,31}$/;
    if (!handle || !HANDLE_REGEX.test(handle)) {
      serverLogger.warn('Invalid handle format', { handle });
      return NextResponse.json(
        { error: 'Invalid handle format.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!prompt) {
      serverLogger.warn('Missing prompt');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate style (optional, defaults to 'default')
    const validStyles = Object.keys(STYLE_PROMPTS);
    const selectedStyle = style && validStyles.includes(style) ? style : 'default';
    serverLogger.info('Using art style', { style: selectedStyle });

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      serverLogger.error('OPENROUTER_API_KEY is not configured');
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Attempt image generation with retry logic
    const attemptImageGeneration = async (currentPrompt: string, isRetry: boolean): Promise<string> => {
      serverLogger.info('Attempting image generation', { isRetry, model: IMAGE_MODEL });

      const finalPrompt = enhancePrompt(currentPrompt, selectedStyle);

      if (canLogAiPayloads()) {
        serverLogger.info('Enhanced image prompt debug metadata', {
          promptChars: finalPrompt.length,
        });
      }

      const breakerKey = 'openrouter:image';
      if (!canProceed(breakerKey)) {
        throw new Error('Image generation service is temporarily unavailable');
      }

      const response = await fetchWithRetry(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || SITE_URL,
            'X-Title': 'X Account Image Generator',
          },
          body: JSON.stringify({
            model: IMAGE_MODEL,
            messages: [
              {
                role: 'user',
                content: finalPrompt,
              },
            ],
            modalities: ['image', 'text'],
          }),
        },
        API_TIMEOUTS.IMAGE_GENERATION
      );

      if (!response.ok) {
        const errorText = await response.text();
        serverLogger.error('OpenRouter API error', {
          status: response.status,
          upstreamBytes: errorText.length,
        });
        recordFailure(breakerKey);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const rawData = await response.json();
      const validationResult = GeminiImageResponseSchema.safeParse(rawData);

      // Handle validation failure - likely a safety filter blocking the response
      if (!validationResult.success) {
        serverLogger.error('Invalid Gemini API response structure', { error: validationResult.error });
        recordFailure(breakerKey);

        // Treat validation failure as potential safety block - retry with safer prompt
        if (!isRetry) {
          serverLogger.info('Image response validation failed; retrying with safer prompt');
          const saferPrompt = await generateSaferPromptWithGrok(handle, currentPrompt);
          return attemptImageGeneration(saferPrompt, true);
        }

        throw new Error('Invalid response from Gemini API - content may be restricted');
      }

      const imageResult = extractGeminiImage(validationResult.data);

      // Check for explicit safety block
      if (imageResult && 'safetyBlocked' in imageResult) {
        if (isRetry) {
          serverLogger.error('Image blocked by safety after retry');
          throw new Error('Content cannot be safely generated - blocked by safety filters');
        }

        serverLogger.info('Safety block detected; retrying with safer prompt');
        const saferPrompt = await generateSaferPromptWithGrok(handle, currentPrompt);
        return attemptImageGeneration(saferPrompt, true);
      }

      if (!imageResult || !('url' in imageResult)) {
        serverLogger.error('No image URL in validated response');
        recordFailure(breakerKey);
        throw new Error('Failed to generate image - no image URL in response');
      }

      recordSuccess(breakerKey);
      serverLogger.info('Image generated successfully');
      return imageResult.url;
    };

    // Generate image
    const imageUrl = await attemptImageGeneration(prompt, false);

    return NextResponse.json({ imageUrl }, { headers: corsHeaders });
  } catch (error) {
    serverLogger.error('Error in generate-image function', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

