import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { getCorsHeaders } from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { parseVideoPollResult } from '@/lib/video-poll-result';
import { z } from 'zod';

// Grok Imagine Video model
const VIDEO_MODEL = 'grok-imagine-video';

// Timeout for video generation request (initial request is fast, polling is separate)
const VIDEO_REQUEST_TIMEOUT = 30000;
// Timeout for polling (5 minutes max)
const VIDEO_POLL_TIMEOUT = 300000;
// Poll interval
const POLL_INTERVAL = 3000;

// Request validation schema
const VideoRequestSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required').max(4000, 'Prompt too long'),
    duration: z.coerce.number().min(1).max(15).optional(),
    seconds: z.coerce.number().min(1).max(15).optional(),
    aspectRatio: z.enum(['16:9', '9:16', '4:3', '3:4', '1:1', '3:2', '2:3']).optional().default('16:9'),
    aspect_ratio: z.enum(['16:9', '9:16', '4:3', '3:4', '1:1', '3:2', '2:3']).optional(),
    resolution: z.enum(['720p', '480p']).optional().default('720p'),
    size: z.enum(['848x480', '1696x960', '1280x720', '1920x1080']).optional(),
    imageUrl: z.string().url().optional(), // For image-to-video
    image_url: z.string().url().optional(),
    videoUrl: z.string().url().optional(), // For video editing
    video_url: z.string().url().optional(),
    referenceImages: z.array(z.string().url()).optional(),
    reference_images: z.array(z.object({ url: z.string().url() })).optional(),
    outputUploadUrl: z.string().url().optional(),
});

// Response schema for video generation request
const VideoRequestResponseSchema = z.object({
    request_id: z.string(),
});

export async function OPTIONS() {
    return NextResponse.json(null, { headers: getCorsHeaders() });
}

export async function POST(req: NextRequest) {
    const corsHeaders = getCorsHeaders();
    const breakerKey = 'xai:imagine-video';

    try {
        const body = await req.json();

        // Validate request
        const validationResult = VideoRequestSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400, headers: corsHeaders }
            );
        }

        const {
            prompt,
            duration,
            seconds,
            aspectRatio,
            aspect_ratio,
            resolution,
            size,
            imageUrl,
            image_url,
            videoUrl,
            video_url,
            referenceImages,
            reference_images,
            outputUploadUrl,
        } = validationResult.data;
        const effectiveDuration = duration ?? seconds ?? 8;
        const effectiveAspectRatio = aspect_ratio ?? aspectRatio ?? '16:9';
        const effectiveImageUrl = image_url ?? imageUrl;
        const effectiveVideoUrl = video_url ?? videoUrl;
        const effectiveReferenceImages = referenceImages ?? reference_images?.map((item) => item.url) ?? [];

        // Check circuit breaker
        if (!canProceed(breakerKey)) {
            return NextResponse.json(
                { error: 'Video generation service is temporarily unavailable. Please try again later.' },
                { status: 503, headers: corsHeaders }
            );
        }

        const xaiApiKey = process.env.XAI_API_KEY;
        if (!xaiApiKey) {
            console.error('XAI_API_KEY is not configured');
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500, headers: corsHeaders }
            );
        }

        // Determine if this is an edit request
        const isEditRequest = !!effectiveVideoUrl;
        const endpoint = isEditRequest
            ? 'https://api.x.ai/v1/videos/edits'
            : 'https://api.x.ai/v1/videos/generations';

        console.log(`Starting video ${isEditRequest ? 'edit' : 'generation'} with Grok Imagine, duration: ${effectiveDuration}s, aspect ratio: ${effectiveAspectRatio}`);

        // Build request body
        const requestBody: Record<string, unknown> = {
            model: VIDEO_MODEL,
            prompt,
            aspect_ratio: effectiveAspectRatio,
            resolution,
        };

        if (size) {
            requestBody.size = size;
        }

        if (outputUploadUrl) {
            requestBody.output = { upload_url: outputUploadUrl };
        }

        // Only add duration for generation (not edits - edited video keeps original duration)
        if (!isEditRequest) {
            requestBody.duration = effectiveDuration;
        }

        // Add video URL for editing
        if (effectiveVideoUrl) {
            requestBody.video = { url: effectiveVideoUrl };
        }
        // Add image URL if provided (for image-to-video)
        else if (effectiveImageUrl) {
            requestBody.image = { url: effectiveImageUrl };
        }

        if (!isEditRequest && effectiveReferenceImages.length) {
            requestBody.reference_images = effectiveReferenceImages.map((url) => ({ url }));
        }

        // Step 1: Send video generation/edit request
        const startResponse = await fetchWithTimeout(
            endpoint,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${xaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            },
            VIDEO_REQUEST_TIMEOUT
        );

        if (!startResponse.ok) {
            const errorText = await startResponse.text();
            console.error('xAI Video API error:', startResponse.status, errorText);
            recordFailure(breakerKey);

            let errorMessage = 'Failed to start video generation';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
            } catch {
                // Use default error message
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: startResponse.status, headers: corsHeaders }
            );
        }

        const startData = await startResponse.json();
        const startValidation = VideoRequestResponseSchema.safeParse(startData);

        if (!startValidation.success) {
            console.error('Invalid video request response:', startValidation.error);
            recordFailure(breakerKey);
            return NextResponse.json(
                { error: 'Invalid response from video generation API' },
                { status: 500, headers: corsHeaders }
            );
        }

        const { request_id } = startValidation.data;
        console.log(`Video generation started, request_id: ${request_id}`);

        // Step 2: Poll for result
        const startTime = Date.now();
        let resultVideoUrl: string | null = null;
        let lastError: string | null = null;
        let lastProgress = 0;
        let respectsModeration: boolean | null = null;
        let resultDuration: number | null = null;

        while (Date.now() - startTime < VIDEO_POLL_TIMEOUT) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

            try {
                const pollResponse = await fetchWithTimeout(
                    `https://api.x.ai/v1/videos/${request_id}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${xaiApiKey}`,
                        },
                    },
                    VIDEO_REQUEST_TIMEOUT
                );

                if (!pollResponse.ok) {
                    const errorText = await pollResponse.text();
                    console.log('Poll response not ok:', pollResponse.status, errorText);

                    // 404 might mean still processing
                    if (pollResponse.status === 404) {
                        continue;
                    }

                    lastError = `Poll failed: ${pollResponse.status}`;
                    continue;
                }

                const pollData = await pollResponse.json();
                console.log('Poll response:', JSON.stringify(pollData).substring(0, 200));

                const parsedResult = parseVideoPollResult(pollData);

                if (parsedResult) {
                    if (parsedResult.progress !== null) {
                        lastProgress = parsedResult.progress;
                    }

                    if (parsedResult.videoUrl) {
                        resultVideoUrl = parsedResult.videoUrl;
                        respectsModeration = parsedResult.respectsModeration;
                        resultDuration = parsedResult.duration;
                        break;
                    }

                    if (parsedResult.error) {
                        lastError = parsedResult.error;
                        break;
                    }

                    if (parsedResult.status === 'failed') {
                        lastError = 'Video generation failed';
                        break;
                    }
                }
            } catch (pollError) {
                console.log('Poll error:', pollError);
                // Continue polling on transient errors
            }
        }

        if (resultVideoUrl) {
            recordSuccess(breakerKey);
            console.log('Video generated successfully');
            return NextResponse.json(
                {
                    video: {
                        id: request_id,
                        url: resultVideoUrl,
                        duration: resultDuration ?? undefined,
                        respectModeration: respectsModeration ?? undefined,
                    }
                },
                { headers: corsHeaders }
            );
        }

        // Timeout or error
        recordFailure(breakerKey);
        return NextResponse.json(
            {
                error: lastError || 'Video generation timed out. Please try again.',
                requestId: request_id, // Return request ID in case they want to check later
                progress: lastProgress,
            },
            { status: 504, headers: corsHeaders }
        );
    } catch (error) {
        console.error('Error in imagine video generation:', error);
        recordFailure(breakerKey);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 500, headers: corsHeaders }
        );
    }
}
