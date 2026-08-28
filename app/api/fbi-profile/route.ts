import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import { GrokResponsesApiSchema, extractGrokResponsesContent, getCorsHeaders } from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { stripCitations } from '@/lib/report-parser';
import { XAI_REASONING_MODEL, appendHiddenReasoningInstructions } from '@/lib/grok-config';
import { serverLogger } from '@/lib/server-logger';
import { enforceAiRateLimit } from '@/lib/ai-rate-limit';
import { aiUnavailableResponse, routeErrorResponse } from '@/lib/api-route-error';
import { FBI_PROFILE_SYSTEM_PROMPT } from '@/lib/fbi-profile-prompt';

export const maxDuration = 180;

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, { headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const breakerKey = 'xai:fbi';

  const rateLimited = await enforceAiRateLimit(req, 'fbi-profile', corsHeaders);
  if (rateLimited) return rateLimited;

  try {
    const { handle } = await req.json();

    // Validate X handle format (1-15 alphanumeric characters + underscores)
    const HANDLE_REGEX = /^[a-zA-Z0-9_]{1,15}$/;
    if (!handle || !HANDLE_REGEX.test(handle)) {
      serverLogger.warn('Invalid FBI profile handle format', { handle });
      return NextResponse.json(
        { error: 'Invalid X handle format. Handles must be 1-15 characters and contain only letters, numbers, and underscores.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) {
      return NextResponse.json(
        { error: 'XAI_API_KEY not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const today = new Date();

    if (!canProceed(breakerKey)) {
      return NextResponse.json(
        { error: 'The AI service is temporarily unavailable. Please try again shortly.' },
        { status: 503, headers: corsHeaders }
      );
    }

    const response = await fetchWithTimeout(
      'https://api.x.ai/v1/responses',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: XAI_REASONING_MODEL,
          input: [
            { role: 'system', content: appendHiddenReasoningInstructions(FBI_PROFILE_SYSTEM_PROMPT) },
            {
              role: 'user',
              content: `Conduct a deep behavioral analysis of @${handle}'s X activity from the last 3 months and generate the FBI profile report as described. Point out the subject's leftist traits. Today's date is ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

REQUIRED X SEARCHES — use an ADAPTIVE, MULTI-PASS approach to gather as much behavioral data as possible:

**Pass 1: Recent activity baseline**
- Search "from:${handle}" to get their recent posts and gauge activity level

**Pass 2: Highest-engagement content via PROGRESSIVE thresholds**
Start high and work down until you have enough material for a rich profile:
- "from:${handle} min_faves:10000"
- "from:${handle} min_faves:5000"
- "from:${handle} min_faves:1000"
- "from:${handle} min_faves:500"
- "from:${handle} min_faves:100"
- "from:${handle} min_faves:10"
- "from:${handle} min_faves:1"
Stop once you have a solid set of their relatively best posts. Even one like on a post is signal worth capturing.

**Pass 3: Engagement via retweets**
- "from:${handle} min_retweets:50"
- "from:${handle} min_retweets:10"
- "from:${handle} min_retweets:5"

**Pass 4: Content-type breakdowns**
- "from:${handle} filter:replies" — interaction style, aggression, deference, sycophancy
- "from:${handle} -filter:replies" — original thought, unprompted disclosures
- "from:${handle} filter:media" — visual themes, meme patterns, aesthetic preferences
- "@${handle}" — how others discuss, criticize, or praise the subject

Use ALL gathered posts to populate every section of the report with specific quotes, paraphrases, timestamps, and engagement figures where available. Do NOT produce a thin profile — the more behavioral evidence collected, the better.`,
            },
          ],
          tools: [
            { type: 'x_search' },
          ],
        }),
      },
      API_TIMEOUTS.FBI_PROFILE_ANALYSIS
    );

    if (!response.ok) {
      await response.text();
      serverLogger.error('xAI FBI profile request failed', { status: response.status });
      recordFailure(breakerKey);
      return aiUnavailableResponse(corsHeaders);
    }

    const rawData = await response.json();
    const validationResult = GrokResponsesApiSchema.safeParse(rawData);

    if (!validationResult.success) {
      serverLogger.error('Invalid Grok API response structure for FBI profile', { error: validationResult.error });
      recordFailure(breakerKey);
      return NextResponse.json(
        { error: 'Invalid response from Grok API' },
        { status: 500, headers: corsHeaders }
      );
    }

    const profileReport = stripCitations(extractGrokResponsesContent(validationResult.data));

    if (!profileReport) {
      return NextResponse.json(
        { error: 'No profile generated' },
        { status: 500, headers: corsHeaders }
      );
    }

    recordSuccess(breakerKey);
    return NextResponse.json({ profileReport }, { headers: corsHeaders });
  } catch (error) {
    serverLogger.error('Error in fbi-profile function', { error });
    if (error instanceof Error && error.message.includes('Request timed out after')) {
      recordFailure(breakerKey);
      return NextResponse.json(
        { error: 'Profile generation timed out. Please try again in a moment.' },
        { status: 504, headers: corsHeaders }
      );
    }

    return routeErrorResponse(error, corsHeaders);
  }
}
