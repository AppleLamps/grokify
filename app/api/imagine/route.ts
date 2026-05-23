import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { getCorsHeaders } from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { getStylePrompt, getValidStyleIds } from '@/lib/style-prompts';
import { mergeImaginePrompt } from '@/lib/merge-imagine-prompt';
import {
    GROK_IMAGE_TEMPORARILY_UNAVAILABLE_MESSAGE,
    isGrokImageGenerationEnabled,
} from '@/lib/grok-image-availability';
import { canLogAiPayloads, serverLogger } from '@/lib/server-logger';
import { z } from 'zod';

// Grok Imagine Image model
const IMAGE_MODEL = 'grok-imagine-image-quality';

// Timeout for image generation (2 minutes)
const IMAGE_TIMEOUT = 120000;

// Request validation schema
const ImageRequestSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required').max(4000, 'Prompt too long'),
    n: z.number().min(1).max(10).optional().default(1),
    aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '2:1', '1:2', '19.5:9', '9:19.5', '20:9', '9:20', 'auto']).optional().default('1:1'),
    response_format: z.enum(['url', 'b64_json']).optional().default('url'),
    // For image editing - provide either a URL or base64 data
    imageUrl: z.string().optional(),
    imageBase64: z.string().optional(),
    // Art style to apply to the prompt
    style: z.string().optional(),
});

// Response schema for xAI image generation
const XaiImageResponseSchema = z.object({
    data: z.array(
        z.object({
            url: z.string().url().optional(),
            b64_json: z.string().optional(),
        })
    ),
});

export async function OPTIONS() {
    return NextResponse.json(null, { headers: getCorsHeaders() });
}

export async function POST(req: NextRequest) {
    const corsHeaders = getCorsHeaders();
    const breakerKey = 'xai:imagine-image';

    try {
        if (!isGrokImageGenerationEnabled()) {
            return NextResponse.json(
                { error: GROK_IMAGE_TEMPORARILY_UNAVAILABLE_MESSAGE },
                { status: 503, headers: corsHeaders }
            );
        }

        const body = await req.json();

        // Validate request
        const validationResult = ImageRequestSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400, headers: corsHeaders }
            );
        }

        const { prompt, n, aspect_ratio, response_format, imageUrl, imageBase64, style } = validationResult.data;

        // Validate and apply style to the prompt
        const validStyles = getValidStyleIds();
        const selectedStyle = style && validStyles.includes(style) ? style : undefined;

        // Merge scene prompt and style into one coherent prompt for Grok Imagine
        let enhancedPrompt = prompt;
        if (selectedStyle && selectedStyle !== 'default') {
            const stylePrompt = getStylePrompt(selectedStyle);
            const mergedPrompt = await mergeImaginePrompt({ prompt, stylePrompt });
            enhancedPrompt = mergedPrompt.prompt;
        } else if (selectedStyle) {
            const stylePrompt = getStylePrompt(selectedStyle);
            enhancedPrompt = `${stylePrompt}\n\n${prompt}`;
        }

        // Check circuit breaker
        if (!canProceed(breakerKey)) {
            return NextResponse.json(
                { error: 'Image generation service is temporarily unavailable. Please try again later.' },
                { status: 503, headers: corsHeaders }
            );
        }

        const xaiApiKey = process.env.XAI_API_KEY;
        if (!xaiApiKey) {
            serverLogger.error('XAI_API_KEY is not configured');
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500, headers: corsHeaders }
            );
        }

        // Determine if this is an edit request or generation request
        const isEditRequest = !!(imageUrl || imageBase64);
        const endpoint = isEditRequest
            ? 'https://api.x.ai/v1/images/edits'
            : 'https://api.x.ai/v1/images/generations';

        serverLogger.info('Grok Imagine request started', {
            mode: isEditRequest ? 'edit' : 'generate',
            count: n,
            aspectRatio: aspect_ratio,
            style: selectedStyle,
            hasImageUrl: Boolean(imageUrl),
            hasInlineMedia: Boolean(imageBase64),
            inlineMediaChars: imageBase64?.length ?? 0,
        });

        // Build request body
        const requestBody: Record<string, unknown> = {
            model: IMAGE_MODEL,
            prompt: enhancedPrompt,
            response_format, // Request base64 for both generation and edits
        };

        // Only add n and aspect_ratio for generation (not edits)
        if (!isEditRequest) {
            requestBody.n = n;
            requestBody.aspect_ratio = aspect_ratio;
        }

        // Add image for editing - xAI expects { url: "..." } format
        if (imageUrl) {
            requestBody.image = { url: imageUrl };
        } else if (imageBase64) {
            // imageBase64 is a data URL like "data:image/png;base64,ABC..."
            // xAI expects image to be an object with url property
            requestBody.image = { url: imageBase64 };
        }

        const requestBodyJson = JSON.stringify(requestBody);
        serverLogger.info('Grok Imagine upstream request metadata', {
            endpoint,
            requestKeys: Object.keys(requestBody),
            requestBytes: requestBodyJson.length,
        });
        if (canLogAiPayloads()) {
            serverLogger.info('Grok Imagine debug payload metadata', {
                promptChars: enhancedPrompt.length,
                mediaChars: imageBase64?.length ?? 0,
            });
        }

        const response = await fetchWithTimeout(
            endpoint,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${xaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: requestBodyJson,
            },
            IMAGE_TIMEOUT
        );

        if (!response.ok) {
            const errorText = await response.text();
            serverLogger.error('xAI Image API error', {
                status: response.status,
                upstreamBytes: errorText.length,
            });
            recordFailure(breakerKey);

            // Parse error message if possible
            let errorMessage = 'Failed to generate image';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
            } catch {
                // Use default error message
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: response.status, headers: corsHeaders }
            );
        }

        const rawData = await response.json();
        const dataValidation = XaiImageResponseSchema.safeParse(rawData);

        if (!dataValidation.success) {
            serverLogger.error('Invalid xAI image response', { error: dataValidation.error });
            recordFailure(breakerKey);
            return NextResponse.json(
                { error: 'Invalid response from image generation API' },
                { status: 500, headers: corsHeaders }
            );
        }

        recordSuccess(breakerKey);
        serverLogger.info('Grok Imagine request completed', {
            count: dataValidation.data.data.length,
        });

        return NextResponse.json(
            {
                data: dataValidation.data.data.map((img, index) => ({
                    id: `img-${Date.now()}-${index}`,
                    url: img.url,
                    b64_json: img.b64_json,
                }))
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        serverLogger.error('Error in imagine image generation', { error });
        recordFailure(breakerKey);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 500, headers: corsHeaders }
        );
    }
}
