import { NextRequest, NextResponse } from 'next/server';

import { runFactCheckX, FACT_CHECK_X_DISCLAIMER } from '@/lib/fact-check-x';
import {
  factCheckXApiResponseSchema,
  factCheckXRequestSchema,
} from '@/lib/fact-check-x-schema';
import { normalizeFactCheckXUrl } from '@/lib/fact-check-x-url';
import { getCorsHeaders } from '@/lib/schemas';

export async function OPTIONS() {
  return NextResponse.json(null, { headers: getCorsHeaders() });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders();

  try {
    const rawBody = await request.json();
    const parsedBody = factCheckXRequestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'A valid X post URL is required.' },
        { status: 400, headers: corsHeaders },
      );
    }

    const { url, mode = 'quick' } = parsedBody.data;

    let normalized;
    try {
      normalized = normalizeFactCheckXUrl(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid X post URL' },
        { status: 400, headers: corsHeaders },
      );
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      console.error('XAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'XAI_API_KEY is not configured' },
        { status: 500, headers: corsHeaders },
      );
    }

    const factCheck = await runFactCheckX({
      apiKey,
      mode,
      normalizedUrl: normalized.normalizedUrl,
      handle: normalized.handle,
      postId: normalized.postId,
    });

    const responsePayload = factCheckXApiResponseSchema.parse({
      normalizedUrl: normalized.normalizedUrl,
      handle: normalized.handle,
      postId: normalized.postId,
      mode,
      disclaimer: FACT_CHECK_X_DISCLAIMER,
      ...factCheck,
    });

    return NextResponse.json(responsePayload, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in fact-check-x route:', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    if (message.includes('temporarily unavailable')) {
      return NextResponse.json(
        { error: message },
        { status: 503, headers: corsHeaders },
      );
    }

    if (message.startsWith('xAI fact check failed:')) {
      return NextResponse.json(
        { error: 'The AI service is currently unavailable. Please try again later.' },
        { status: 502, headers: corsHeaders },
      );
    }

    if (message === 'Invalid fact check response') {
      return NextResponse.json(
        { error: 'The AI service returned a malformed response. Please try again.' },
        { status: 500, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders },
    );
  }
}
