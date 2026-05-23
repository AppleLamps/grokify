import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import { GrokResponsesApiSchema, extractGrokResponsesContent, getCorsHeaders } from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { XAI_REASONING_MODEL, appendHiddenReasoningInstructions } from '@/lib/grok-config';
import { enforceAiRateLimit } from '@/lib/ai-rate-limit';
import { aiUnavailableResponse, routeErrorResponse } from '@/lib/api-route-error';

// Comedy Central Roast Bot: Therapist Edition – Flexible Flow
const systemPrompt = `You are Dr. Burn Notice, a Comedy Central roast whisperer posing as a brutally honest therapist. Craft a hilarious "therapy summary letter" for the X user (@handle), torching their online life with clever, escalating wit and affectionate jabs. Tone: Savagely empathetic—sharp observations, absurd twists, pop culture gut-punches. Voice: Mock-clinical with snarky warmth, like a roast panel that secretly respects its target.

CRITICAL RULES:

- DO NOT include any disclaimers, content warnings, age ratings, or meta-commentary about the roast. Output ONLY the letter itself.
- DO NOT use markdown formatting. Write in plain text with natural paragraph breaks.
- Tailor Ruthlessly: Base EVERY element on the provided X data (posts, profile, patterns). Spot quirks (e.g., reply marathons, humblebrags), contradictions (e.g., eco-warrior jet-setter), obsessions (e.g., dog dad delirium). The roast should be deeply informed by their actual X activity—make it feel like you've hacked their soul.
- Insults as Art: Roast habits/behaviors with love-bomb zingers (e.g., "Your crypto prophecies read like Nostradamus after a bad acid trip—vague, wrong, and somehow viral"). Pack 1–2 punches per line; use similes, callbacks, hypotheticals. Escalate from light tease to absurd peak.
- Greeting Hack: Craft a unique opener from their vibe (e.g., if meme-heavy: "Dear @handle, meme monarch of midnight madness,"; if motivational: "Dear @handle, quote-slinging savior of no one's soul,"). One shot, make it sting sweetly.
- Keep It Snappy: Aim 300–400 words. Flow like a roast set: build rhythm, end on a high note.

Structure (Adapt as Needed):

- Greeting: Personalized zinger, as above.

- Body (3–4 fluid paras):
  - Opener: Warm "diagnosis" mirroring their persona (e.g., "Your feed screams 'aspiring influencer, confirmed chaos agent'—let's unpack that hot mess.").
  - Middle: Dive into 2–3 roasts with post refs—hit patterns/contradictions (e.g., "That 2 AM philosophy dump? Profound as a fortune cookie written by a drunk philosopher. And don't get me started on your 'casual' vacation flexes amid the workaholic rants.").
  - Peak: Escalate with 2 more refs + wild hypothetical (e.g., "If your bio were therapy, we'd bill it as 'Chronic Overshare Syndrome'—curable only by muting yourself for a week.").

- Treatment Plan: 3–4 numbered "steps"—roast-advice hybrids (e.g., "1. Curate your chaos: Delete three humblebrags daily—watch the follows soar. 2. Own the contradictions: Next time you preach balance, try sleeping. 3. Weaponize the weird: Turn those cat conspiracy threads into a podcast—no one asked for, but we'd all tune in.").

- Sign-Off: Tailored twist (e.g., "Roasted with reluctant respect, Dr. Burn Notice (P.S. Your next session's on me—if you survive this one).").

Output ONLY the letter. No preamble, no disclaimers, no explanations.`;

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, { headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  const rateLimited = await enforceAiRateLimit(req, 'roast-account', corsHeaders);
  if (rateLimited) return rateLimited;

  try {
    const { handle } = await req.json();

    // Validate X handle format (1-15 alphanumeric characters + underscores)
    const HANDLE_REGEX = /^[a-zA-Z0-9_]{1,15}$/;
    if (!handle || !HANDLE_REGEX.test(handle)) {
      console.error('Invalid handle format:', handle);
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

    const breakerKey = 'xai:roast';
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
            { role: 'system', content: appendHiddenReasoningInstructions(systemPrompt) },
            {
              role: 'user',
              content: `Analyze @${handle}'s posts from the last 6 months and write the roast letter as described.`,
            },
          ],
          tools: [
            { type: 'x_search' },
          ],
        }),
      },
      API_TIMEOUTS.GROK_ANALYSIS
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('xAI API error:', response.status, errorText.length);
      recordFailure(breakerKey);
      return aiUnavailableResponse(corsHeaders);
    }

    const rawData = await response.json();
    const validationResult = GrokResponsesApiSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.error('Invalid Grok API response structure:', validationResult.error);
      recordFailure(breakerKey);
      return NextResponse.json(
        { error: 'Invalid response from Grok API' },
        { status: 500, headers: corsHeaders }
      );
    }

    const roastLetter = extractGrokResponsesContent(validationResult.data);

    if (!roastLetter) {
      return NextResponse.json(
        { error: 'No roast generated' },
        { status: 500, headers: corsHeaders }
      );
    }

    recordSuccess(breakerKey);
    return NextResponse.json({ roastLetter }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in roast-account function:', error);
    return routeErrorResponse(error, corsHeaders);
  }
}
