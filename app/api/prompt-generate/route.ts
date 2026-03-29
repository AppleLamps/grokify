import { NextRequest, NextResponse } from 'next/server';
import {
  PROMPT_CONFIG,
  API_CONFIG,
  OPENROUTER_MODELS,
  SYSTEM_PROMPTS,
  getPromptMode,
  DEFAULT_PROMPT_SCHEMA,
  JSON_MODE_SCHEMA,
  parseStructuredContent,
  ensureTextPrompt,
  ensureJsonPrompt,
  type JsonPromptPayload,
  type StructuredPayload,
} from '@/lib/prompt-config';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { buildPromptControlBlock, normalizeLightingMode } from '@/lib/prompt-controls';
import { getRetryDelayMs, shouldRetryPromptRequest } from '@/lib/prompt-route-utils';
import { SITE_URL } from '@/lib/site';
import type { ImageIntent, LightingMode } from '@/lib/prompt-config-shared';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

// Types
interface GenerateRequestBody {
  idea?: string;
  directions?: string;
  isJsonMode?: boolean;
  isTestMode?: boolean;
  isVideoPrompt?: boolean;
  detailBoost?: boolean;
  realismBias?: boolean;
  lightingMode?: LightingMode;
  imageIntent?: ImageIntent;
  imageBase64?: string;
  imageMimeType?: string;
}

type OpenRouterContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

interface OpenRouterMessage {
  role: 'system' | 'user';
  content: OpenRouterContent;
}

interface JsonSchemaResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    schema: object;
    strict?: boolean;
  };
}

interface OpenRouterRequestBody {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  usage?: { include: boolean };
  response_format?: JsonSchemaResponseFormat;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: unknown };
  }>;
  usage?: unknown;
}

// Helper to build user content
const buildUserContent = (
  text: string,
  imageBase64?: string | null,
  mimeType?: string
): OpenRouterContent => {
  if (imageBase64) {
    return [
      { type: 'text', text },
      {
        type: 'image_url',
        image_url: { url: `data:${mimeType ?? 'image/png'};base64,${imageBase64}` },
      },
    ];
  }
  return text;
};

// OpenRouter API call
async function makeOpenRouterCall(
  apiKey: string,
  body: OpenRouterRequestBody,
  title: string = 'Grokify Prompt Generator'
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

  const referer = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || SITE_URL;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-Title': title,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

const RETRY_DELAYS_MS = [250, 750];

async function makeOpenRouterCallWithRetry(
  apiKey: string,
  body: OpenRouterRequestBody,
  hasInlineImage: boolean,
  title: string = 'Grokify Prompt Generator'
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    lastResponse = await makeOpenRouterCall(apiKey, body, title);

    if (lastResponse.ok || !shouldRetryPromptRequest(lastResponse.status, hasInlineImage)) {
      return lastResponse;
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      const delayMs = getRetryDelayMs(lastResponse.headers, attempt, RETRY_DELAYS_MS);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return lastResponse ?? makeOpenRouterCall(apiKey, body, title);
}

export async function POST(request: NextRequest) {
  const breakerKey = 'openrouter:prompt';

  try {
    const body: GenerateRequestBody = await request.json();

    const {
      idea = '',
      directions = '',
      isJsonMode = false,
      isTestMode = false,
      isVideoPrompt = false,
      detailBoost = false,
      realismBias = false,
      lightingMode,
      imageIntent = 'RECREATE_CLOSELY',
      imageBase64,
      imageMimeType = 'image/png',
    } = body;

    // Validate input
    if (idea.length > PROMPT_CONFIG.IDEA_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Idea must be under ${PROMPT_CONFIG.IDEA_MAX_LENGTH} characters.` },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (directions.length > PROMPT_CONFIG.DIRECTIONS_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Directions must be under ${PROMPT_CONFIG.DIRECTIONS_MAX_LENGTH} characters.` },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (!idea.trim() && !imageBase64) {
      return NextResponse.json(
        { error: 'Either an "idea" or an image must be provided' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'API key is not configured. Please contact the administrator.' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    // Build user prompt
    let userPrompt = '';
    if (imageBase64 && !idea.trim() && !directions.trim()) {
      userPrompt = imageIntent === 'RECREATE_CLOSELY'
        ? 'Please analyze this image and create a detailed prompt to recreate it as closely as possible for AI image generation. Prioritize fidelity to the uploaded image, preserving the same subject, composition, materials, proportions, lighting relationships, and overall visual character.'
        : 'Please analyze this image and create a detailed prompt for AI image generation.';
    } else if (imageBase64 && (idea || directions)) {
      userPrompt = imageIntent === 'RECREATE_CLOSELY'
        ? 'Please analyze this image and create a prompt for AI image generation that recreates the uploaded image as closely as possible while incorporating the user instructions'
        : 'Please analyze this image and create a prompt for AI image generation';
      if (idea.trim()) {
        userPrompt += ` incorporating this idea: ${idea}`;
      }
      if (directions.trim()) {
        userPrompt += ` with these additional directions: ${directions}`;
      }
    } else {
      userPrompt = `Idea: ${idea}`;
      if (directions.trim()) {
        userPrompt += `\n\nAdditional directions: ${directions}`;
      }
    }

    userPrompt += buildPromptControlBlock({
      detailBoost,
      realismBias,
      lightingMode: normalizeLightingMode(lightingMode),
    });

    if (isJsonMode) {
      userPrompt += '\n\nReturn only raw JSON. No markdown fences, no explanations, no extra text.';
    }

    // Select system prompt and response format
    const promptMode = getPromptMode({ isJsonMode, isVideoPrompt, isTestMode });
    const finalSystemPrompt = SYSTEM_PROMPTS[promptMode];

    const responseFormat: JsonSchemaResponseFormat = {
      type: 'json_schema',
      json_schema: isJsonMode ? JSON_MODE_SCHEMA : DEFAULT_PROMPT_SCHEMA,
    };

    const requestBody: OpenRouterRequestBody = {
      model: OPENROUTER_MODELS.PRIMARY,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        {
          role: 'user',
          content: buildUserContent(userPrompt, imageBase64, imageMimeType),
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      usage: { include: true },
      response_format: responseFormat,
    };

    if (!canProceed(breakerKey)) {
      return NextResponse.json(
        { error: 'The AI service is temporarily unavailable. Please try again shortly.' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const openRouterResponse = await makeOpenRouterCallWithRetry(apiKey, requestBody, Boolean(imageBase64));

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', openRouterResponse.status, errorText);
      recordFailure(breakerKey);

      if (openRouterResponse.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment before trying again.' },
          { status: 429, headers: NO_STORE_HEADERS }
        );
      }

      return NextResponse.json(
        { error: 'The AI service is currently unavailable. Please try again later.' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    const data: ChatCompletionResponse = await openRouterResponse.json();

    if (!data?.choices?.[0]?.message?.content) {
      console.error('Invalid OpenRouter API response structure:', data);
      return NextResponse.json(
        { error: 'Received an invalid response from the AI service. Please try again.' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    let parsedPayload: StructuredPayload;
    try {
      parsedPayload = parseStructuredContent(data.choices[0].message?.content);
    } catch (parseError) {
      console.error('Failed to parse structured response:', parseError);
      return NextResponse.json(
        { error: 'The AI service returned a malformed response. Please try again.' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    let finalPrompt: string | JsonPromptPayload;
    try {
      finalPrompt = isJsonMode
        ? ensureJsonPrompt(parsedPayload)
        : ensureTextPrompt(parsedPayload);
    } catch (validationError) {
      console.error('Structured response validation failed:', validationError);
      return NextResponse.json(
        { error: 'The AI service returned an invalid response. Please try again.' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    if (!isJsonMode && !finalPrompt) {
      return NextResponse.json(
        { error: 'The AI service returned an empty response. Please try again with different input.' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    recordSuccess(breakerKey);

    return NextResponse.json({
      success: true,
      prompt: finalPrompt,
      usage: data.usage || null,
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('API Route Error:', error);
    recordFailure(breakerKey);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'The AI service took too long to respond. Please try again.' },
        { status: 504, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
