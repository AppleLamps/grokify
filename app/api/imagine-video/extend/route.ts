import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { getCorsHeaders } from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { parseVideoPollResult } from '@/lib/video-poll-result';
import { z } from 'zod';

const VIDEO_MODEL = 'grok-imagine-video';
const VIDEO_REQUEST_TIMEOUT = 30000;
const VIDEO_POLL_TIMEOUT = 300000;
const POLL_INTERVAL = 3000;

const VideoExtensionSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(4000, 'Prompt too long'),
  duration: z.coerce.number().min(1).max(10).optional(),
  seconds: z.coerce.number().min(1).max(10).optional(),
  videoUrl: z.string().url('Video URL is required'),
  outputUploadUrl: z.string().url().optional(),
});

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
    const validationResult = VideoExtensionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400, headers: corsHeaders }
      );
    }

    const { prompt, duration, seconds, videoUrl, outputUploadUrl } = validationResult.data;
    const effectiveDuration = duration ?? seconds ?? 6;

    if (!canProceed(breakerKey)) {
      return NextResponse.json(
        { error: 'Video generation service is temporarily unavailable. Please try again later.' },
        { status: 503, headers: corsHeaders }
      );
    }

    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const requestBody: Record<string, unknown> = {
      model: VIDEO_MODEL,
      prompt,
      duration: effectiveDuration,
      video: { url: videoUrl },
    };

    if (outputUploadUrl) {
      requestBody.output = { upload_url: outputUploadUrl };
    }

    const startResponse = await fetchWithTimeout(
      'https://api.x.ai/v1/videos/extensions',
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
      recordFailure(breakerKey);
      return NextResponse.json(
        { error: errorText || 'Failed to start video extension' },
        { status: startResponse.status, headers: corsHeaders }
      );
    }

    const startData = await startResponse.json();
    const startValidation = VideoRequestResponseSchema.safeParse(startData);
    if (!startValidation.success) {
      recordFailure(breakerKey);
      return NextResponse.json(
        { error: 'Invalid response from video extension API' },
        { status: 500, headers: corsHeaders }
      );
    }

    const { request_id } = startValidation.data;
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
          if (pollResponse.status === 404) continue;
          lastError = `Poll failed: ${pollResponse.status}`;
          continue;
        }

        const pollData = await pollResponse.json();
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
            lastError = 'Video extension failed';
            break;
          }
        }
      } catch {
        // Continue polling through transient failures.
      }
    }

    if (resultVideoUrl) {
      recordSuccess(breakerKey);
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

    recordFailure(breakerKey);
    return NextResponse.json(
      {
        error: lastError || 'Video extension timed out. Please try again.',
        requestId: request_id,
        progress: lastProgress,
      },
      { status: 504, headers: corsHeaders }
    );
  } catch (error) {
    recordFailure(breakerKey);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}
