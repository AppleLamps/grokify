import { z } from 'zod';

/**
 * xAI Grok Chat Completions API response schema (legacy)
 * Used for non-search endpoints
 */
export const GrokResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      })
    )
    .min(1, 'No choices returned from Grok API'),
});

/**
 * xAI Grok Responses API schema (new Agent Tools API)
 * Used for analyze-account, roast-account, fbi-profile, osint-profile endpoints with search tools
 * The Responses API returns output as an array with content items
 */
export const GrokResponsesApiSchema = z.object({
  output: z.array(
    z.object({
      type: z.string(),
      content: z.array(
        z.object({
          type: z.string(),
          text: z.string().optional(),
        })
      ).optional(),
    })
  ),
  citations: z.array(z.string()).optional(),
});

/**
 * Helper to extract content from validated Grok Responses API response
 */
export function extractGrokResponsesContent(data: z.infer<typeof GrokResponsesApiSchema>): string {
  // Find the message output item and extract text from its content
  for (const item of data.output) {
    if (item.type === 'message' && item.content) {
      const textContent = item.content.find(c => c.type === 'output_text' || c.type === 'text');
      if (textContent?.text) {
        return textContent.text;
      }
    }
  }
  // Fallback: try to find any text content
  for (const item of data.output) {
    if (item.content) {
      for (const content of item.content) {
        if (content.text) {
          return content.text;
        }
      }
    }
  }
  return '';
}

/**
 * OpenRouter/Gemini image generation response schema
 * Includes support for native_finish_reason for safety blocks
 */
export const GeminiImageResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        native_finish_reason: z.string().optional(),
        message: z.object({
          images: z
            .array(
              z.object({
                image_url: z.object({
                  url: z.string().url('Invalid image URL from Gemini'),
                }),
              })
            )
            .optional(),
        }),
      })
    )
    .min(1, 'No choices returned from Gemini API'),
});

/**
 * GetImg.ai Flux response schema
 * Supports both URL and base64 response formats
 */
export const GetImgResponseSchema = z.object({
  // GetImg returns image as base64 in 'image' field or URL in 'url' field
  image: z.string().optional(),
  url: z.string().url().optional(),
  data: z
    .array(
      z.object({
        url: z.string().url(),
      })
    )
    .optional(),
});

/**
 * Helper to extract content from validated Grok response
 */
export function extractGrokContent(data: z.infer<typeof GrokResponseSchema>): string {
  return data.choices[0].message.content;
}

/**
 * Helper to extract image URL from validated Gemini response
 * Returns null if safety blocked (for retry logic)
 */
export function extractGeminiImage(
  data: z.infer<typeof GeminiImageResponseSchema>
): { url: string } | { safetyBlocked: true } | null {
  const choice = data.choices[0];

  if (choice.native_finish_reason === 'IMAGE_SAFETY') {
    return { safetyBlocked: true };
  }

  const imageUrl = choice.message.images?.[0]?.image_url?.url;
  if (!imageUrl) {
    return null;
  }

  return { url: imageUrl };
}

/**
 * Helper to extract image URL from validated GetImg response
 */
export function extractGetImgUrl(data: z.infer<typeof GetImgResponseSchema>): string | null {
  return data.image || data.url || data.data?.[0]?.url || null;
}

import { SITE_URL } from '@/lib/site';

/**
 * CORS configuration helper.
 * Defaults to the production site origin only — never `*`.
 * Set ALLOWED_ORIGINS (comma-separated) to permit additional browser origins.
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? SITE_URL)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
  };

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
    headers.Vary = 'Origin';
  } else if (!requestOrigin && allowedOrigins.length === 1) {
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0];
  }

  return headers;
}
