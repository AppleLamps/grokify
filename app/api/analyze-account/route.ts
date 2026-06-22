import { NextRequest, NextResponse } from 'next/server';
import { getDb, xAccountCache } from '@/db';
import { eq, gt, and } from 'drizzle-orm';
import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import { GrokResponseSchema, extractGrokContent, GrokResponsesApiSchema, extractGrokResponsesContent, getCorsHeaders } from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { XAI_REASONING_MODEL, appendHiddenReasoningInstructions } from '@/lib/grok-config';
import { enforceAiRateLimit } from '@/lib/ai-rate-limit';
import { encodeSseEvent, readSseStream } from '@/lib/sse';
import {
  aiUnavailableResponse,
  routeErrorResponse,
} from '@/lib/api-route-error';

// Feature flag: Set to true to enable caching
const ENABLE_CACHING = process.env.ENABLE_CACHING === 'true';

// Streaming holds the connection open for the full agentic search (up to 2 minutes)
export const maxDuration = 180;

const AI_UNAVAILABLE_MESSAGE = 'The AI service is temporarily unavailable. Please try again shortly.';

/** Events forwarded to the browser while Grok analyzes an account. */
type AnalyzeStreamEvent =
  | { type: 'search'; query: string }
  | { type: 'status'; label: 'searching' | 'synthesizing' }
  | { type: 'result'; imagePrompt: string }
  | { type: 'error'; message: string };

function sseHeaders(corsHeaders: Record<string, string>): Record<string, string> {
  return {
    ...corsHeaders,
    'Content-Type': 'text/event-stream; charset=utf-8',
    // Disable proxy buffering so search events reach the client as they happen
    'X-Accel-Buffering': 'no',
  };
}

/** The subset of upstream xAI Responses SSE events this route inspects. */
interface UpstreamStreamEvent {
  type?: string;
  input?: unknown;
  item?: {
    type?: string;
    arguments?: unknown;
    action?: { query?: unknown };
  };
  response?: unknown;
}

/** Pull the query string out of an x_search tool call's JSON arguments. */
function extractSearchQuery(input: unknown): string | null {
  if (typeof input !== 'string' || !input) return null;
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed.query === 'string' && parsed.query.trim()) {
      return parsed.query.trim();
    }
  } catch {
    // Partial or non-JSON arguments - skip rather than leak raw payloads
  }
  return null;
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, { headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  const rateLimited = await enforceAiRateLimit(req, 'analyze-account', corsHeaders);
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
      console.error('XAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'XAI_API_KEY is not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Analyzing X account: @${handle}`);

    // Cache lookup (only if caching is enabled)
    let cachedData: { searchResponse: unknown } | null = null;
    if (ENABLE_CACHING) {
      const db = getDb();
      const cached = await db
        .select({ searchResponse: xAccountCache.searchResponse })
        .from(xAccountCache)
        .where(
          and(
            eq(xAccountCache.xHandle, handle.toLowerCase()),
            gt(xAccountCache.expiresAt, new Date())
          )
        )
        .limit(1);

      if (cached.length > 0) {
        cachedData = cached[0];
      }
    }

    // Enhanced system prompt with comprehensive multi-search analysis guidance
    let systemPrompt = `You are an expert Art Director AI specializing in satirical cartoon and comic book illustration. Your function is to translate the essence of an X social media account into a single, masterful cartoon image generation prompt.

CRITICAL: You have extensive search capabilities - USE THEM AGGRESSIVELY. Conduct multiple searches to build the most complete understanding possible. Do NOT rely on a single search.

Your analysis process:
1. **Adaptive Data Gathering:** Execute targeted X searches, adapting to the account's activity level:
   - Search recent posts first to gauge their activity level
   - Find their best content using PROGRESSIVE thresholds - start with high minimums (min_faves:10000) and lower them (5000→1000→500→100→10→1) until you find enough of their relatively best posts
   - For smaller accounts with low engagement, their "best" post might only have 1-10 likes - that's fine! Adjust your expectations.
   - Analyze media posts specifically (filter:media) to understand visual aesthetics
   - Review reply patterns (filter:replies) to understand personality and interaction style
   - Check original posts only (-filter:replies) to see their core content
   - Search mentions (@username) to see how others perceive them
   - IMPORTANT: Even accounts with few posts have distinct personalities. Work with whatever content is available.

2. **Deep Content Analysis:** Thoroughly examine the account's posts, including text, images, videos, and any visual media. Identify core themes, personality traits, recurring jokes, communication style, visual aesthetics, and unique characteristics.

3. **Pattern Recognition:** Look for patterns in posting frequency, topics, tone shifts, visual style, and engagement patterns. Note any signature phrases, memes, or visual motifs. Pay special attention to what content gets the most engagement.

4. **Personality Synthesis:** Distill the account's essence into key personality traits—are they witty, serious, chaotic, methodical, rebellious, inspirational? What makes them distinctive?

5. **Visual Metaphor Creation:** Transform your understanding into a compelling visual metaphor that captures the account's spirit, humor, and unique identity.

6. **Prompt Construction:** Build the final image prompt following the strict guidelines below.

Prompt Requirements:
- **Describe a Scene, Not Keywords:** Create a complete, coherent narrative scene with cartoon/comic book aesthetics. Think of it as a single frame from a satirical comic strip.
- **Be Hyper-Specific:** Use precise illustration language. Mention bold outlines, exaggerated expressions, vibrant color palettes, halftone shading, dynamic action lines, satirical visual gags, and specific artistic techniques.
- **Incorporate Rich Detail:** Include visual humor, environmental storytelling, character expressions (exaggerated, cartoonish), symbolic objects, and dense background details packed with jokes and references.
- **Maintain Relevance & Humor:** The scene must be a creative, humorous, or satirical visual metaphor that encapsulates the account's personality and content, with specific references woven in naturally.
- **Visual Content Integration:** If the account frequently shares images or videos, incorporate visual elements that reflect their aesthetic preferences, color schemes, or visual themes.
- **State the Art Style:** Conclude with a clear cartoon/comic directive (e.g., "MAD Magazine style satirical cartoon," "Bold comic book illustration with vibrant colors," "Underground comix style with dense detail," "Political cartoon with exaggerated caricature style," "Anime-inspired satirical illustration").
- **Length:** The prompt must be 4-6 sentences—comprehensive but concise.

Examples of masterful cartoon prompts:
- "A superhero tech CEO bursting through a wall made of broken social media logos and blue verification checkmarks, phone held high crackling with electric lightning bolts, wearing a cape made of tangled ethernet cables and a chest emblem showing a rocket ship. The chaotic office scene behind shows robots running in panic, monitors displaying crashing stock charts, and papers flying everywhere with 'FREE SPEECH' and 'MEMES' written on them. Dynamic action lines radiate from the center, debris and shattered glass frozen mid-explosion. Bold comic book illustration style with vibrant primary colors, thick black outlines, halftone dot shading, and exaggerated heroic proportions reminiscent of Silver Age Marvel comics."
- "A cartoonish anthropomorphic coffee cup character with bulging googly eyes and a manic grin, surrounded by a chaotic home office filled with dozens of glowing computer screens showing lines of code, energy drink cans scattered everywhere, and Post-it notes covering every surface with bug reports and 'TODO' lists. Steam rises from the coffee cup forming shapes of curly braces, semicolons, and error messages while smaller bug characters with antennae scurry across keyboards. The character has bags under its eyes and is typing frantically on multiple keyboards at once. MAD Magazine style satirical cartoon with exaggerated features, vibrant colors, dense visual gags, and a playful, chaotic energy."
- "A grinning motivational speaker caricature with an impossibly wide smile and oversized teeth, standing atop a mountain of glowing self-help books stacked impossibly high, arms raised in a victorious V-shape with dollar signs shooting from their fingertips like magical rays. Smaller cartoon figures climb the book mountain below, some slipping on titles like 'GET RICH QUICK' and 'MINDSET SECRETS,' while motivational buzzwords float in speech bubbles ('HUSTLE!' 'GRIND!' 'MANIFEST!'). The background shows a sunrise with exaggerated lens flare effects and inspirational light beams. Bold satirical cartoon style with vibrant, oversaturated colors, thick outlines, exaggerated proportions, and comedic visual metaphors reminiscent of editorial political cartoons."

Your final output must be ONLY the image generation prompt. No preamble, no explanation, no analysis. Just the prompt.`;

    // Add safety guidelines if requested

    const finalSystemPrompt = appendHiddenReasoningInstructions(systemPrompt);

    const today = new Date();

    // Use cached data if available and caching is enabled
    if (ENABLE_CACHING && cachedData?.searchResponse) {
      console.log(`Cache hit for @${handle}, generating fresh prompt from cached data`);

      const cachedContext = JSON.stringify(cachedData.searchResponse);

      const breakerKey = 'xai:analyze';
      if (!canProceed(breakerKey)) {
        return NextResponse.json(
          { error: AI_UNAVAILABLE_MESSAGE },
          { status: 503, headers: corsHeaders }
        );
      }

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
              { role: 'system', content: finalSystemPrompt },
              {
                role: 'user',
                content: `Based on this X account data: ${cachedContext}\n\nCreate a humorous but relevant image generation prompt that captures the account's essence.`,
              },
            ],
            // No tools - we're using cached data
          }),
        },
        API_TIMEOUTS.GROK_ANALYSIS
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('xAI API error (cached):', response.status, errorText.length);
        recordFailure(breakerKey);
        return aiUnavailableResponse(corsHeaders);
      }

      const rawData = await response.json();
      const validationResult = GrokResponseSchema.safeParse(rawData);

      if (!validationResult.success) {
        console.error('Invalid Grok API response structure:', validationResult.error);
        recordFailure(breakerKey);
        return NextResponse.json(
          { error: 'Invalid response from Grok API' },
          { status: 500, headers: corsHeaders }
        );
      }

      const imagePrompt = extractGrokContent(validationResult.data);
      recordSuccess(breakerKey);

      if (!imagePrompt) {
        console.error('No prompt generated from Grok');
        return NextResponse.json(
          { error: 'Failed to generate image prompt' },
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('Generated prompt:', imagePrompt);

      // Same SSE shape as the streaming branch so the client consumes one format
      const events: AnalyzeStreamEvent[] = [
        { type: 'status', label: 'synthesizing' },
        { type: 'result', imagePrompt },
      ];
      return new Response(events.map(encodeSseEvent).join(''), {
        headers: sseHeaders(corsHeaders),
      });
    } else {
      // Perform agentic search with tools
      console.log(`Performing agentic search for @${handle}${ENABLE_CACHING ? ' (cache miss)' : ' (caching disabled)'}`);

      const breakerKey = 'xai:analyze';
      if (!canProceed(breakerKey)) {
        return NextResponse.json(
          { error: AI_UNAVAILABLE_MESSAGE },
          { status: 503, headers: corsHeaders }
        );
      }

      // fetchWithTimeout only guards until headers arrive; with streaming the
      // deadline must also cover the body, so manage the abort timer directly.
      const upstreamController = new AbortController();
      const timeoutId = setTimeout(
        () => upstreamController.abort(),
        API_TIMEOUTS.ENHANCED_ACCOUNT_ANALYSIS
      );

      let response: Response;
      try {
        response = await fetch('https://api.x.ai/v1/responses', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${xaiApiKey}`,
            'Content-Type': 'application/json',
          },
          signal: upstreamController.signal,
          body: JSON.stringify({
            stream: true,
            model: XAI_REASONING_MODEL,
            input: [
              { role: 'system', content: finalSystemPrompt },
              {
                role: 'user',
                content: `Execute a COMPREHENSIVE analysis of @${handle}'s X account. Today is ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

REQUIRED X SEARCHES - Use an ADAPTIVE approach based on account activity level:

**Step 1: Get baseline content**
- Search "from:${handle}" - Get their recent posts first to understand their activity level

**Step 2: Find their best content using PROGRESSIVE thresholds**
For engagement searches, start high and work down until you find enough posts:
- Try "from:${handle} min_faves:10000" first
- If no/few results, try "from:${handle} min_faves:5000"
- If still sparse, try "from:${handle} min_faves:1000"
- If still sparse, try "from:${handle} min_faves:500"
- If still sparse, try "from:${handle} min_faves:100"
- If still sparse, try "from:${handle} min_faves:10"
- If still sparse, try "from:${handle} min_faves:1"
- Stop once you have enough strong posts; only use "from:${handle}" without a minimum as a last resort

Same approach for retweets:
- Start with "from:${handle} min_retweets:100"
- Then try min_retweets:50, min_retweets:25, min_retweets:10, min_retweets:5
- Stop once you find their relatively most-shared content

**Step 3: Content type analysis**
- Search "from:${handle} filter:media" - Analyze their visual content and aesthetic
- Search "from:${handle} filter:replies" - Understand their interaction style
- Search "from:${handle} -filter:replies" - See their original content only
- Search "@${handle}" - See how others perceive and discuss them

**IMPORTANT FOR LOW-ACTIVITY ACCOUNTS:**
- If this is a smaller account with few posts, that's OK! Use whatever content is available.
- Even accounts with just a few posts have personalities worth capturing.
- Focus on themes, tone, topics, and style rather than raw engagement numbers.
- A single thoughtful post can reveal more than 100 viral ones.

DO NOT produce a shallow analysis. Adapt your search strategy to the account's activity level. Find their best content relative to THEIR baseline. Understand their visual style, personality, and what resonates with their audience.

Based on this deep, multi-faceted analysis, create a humorous but highly relevant and specific image generation prompt that captures their account's essence, visual aesthetic, personality, and unique characteristics.`,
              },
            ],
            tools: [
              { type: 'x_search' },
            ],
          }),
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        recordFailure(breakerKey);
        console.error('xAI API request failed:', fetchError);
        return aiUnavailableResponse(corsHeaders);
      }

      if (!response.ok || !response.body) {
        clearTimeout(timeoutId);
        const errorText = await response.text().catch(() => '');
        console.error('xAI API error:', response.status, errorText.length);
        recordFailure(breakerKey);
        return aiUnavailableResponse(corsHeaders);
      }

      const upstreamBody = response.body;
      const encoder = new TextEncoder();

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          let closed = false;
          const send = (event: AnalyzeStreamEvent) => {
            if (closed) return;
            try {
              controller.enqueue(encoder.encode(encodeSseEvent(event)));
            } catch {
              closed = true;
            }
          };

          send({ type: 'status', label: 'searching' });

          let completedResponse: unknown = null;
          let upstreamFailed = false;
          let sentSynthesizing = false;

          try {
            await readSseStream(upstreamBody, (data) => {
              if (data === '[DONE]') return;
              let event: UpstreamStreamEvent;
              try {
                event = JSON.parse(data) as UpstreamStreamEvent;
              } catch {
                return;
              }

              switch (event.type) {
                // x_search tool calls arrive as custom_tool_call items; the
                // arguments JSON lands in custom_tool_call_input.done
                case 'response.custom_tool_call_input.done': {
                  const query = extractSearchQuery(event.input);
                  if (query) send({ type: 'search', query });
                  break;
                }
                case 'response.output_item.added': {
                  if (event.item?.type === 'message' && !sentSynthesizing) {
                    sentSynthesizing = true;
                    send({ type: 'status', label: 'synthesizing' });
                  }
                  break;
                }
                case 'response.output_item.done': {
                  // Fallback for the documented x_search_call item shape
                  const item = event.item;
                  if (item?.type === 'x_search_call') {
                    const query =
                      extractSearchQuery(item.arguments) ??
                      (typeof item.action?.query === 'string' ? item.action.query : null);
                    if (query) send({ type: 'search', query });
                  }
                  break;
                }
                case 'response.completed': {
                  completedResponse = event.response;
                  break;
                }
                case 'response.failed':
                case 'response.incomplete': {
                  upstreamFailed = true;
                  break;
                }
              }
            });
          } catch (streamError) {
            console.error('xAI stream error:', streamError);
            upstreamFailed = true;
          } finally {
            clearTimeout(timeoutId);
          }

          if (upstreamFailed || !completedResponse) {
            recordFailure(breakerKey);
            send({ type: 'error', message: AI_UNAVAILABLE_MESSAGE });
            if (!closed) controller.close();
            return;
          }

          const validationResult = GrokResponsesApiSchema.safeParse(completedResponse);
          if (!validationResult.success) {
            console.error('Invalid Grok API response structure:', validationResult.error);
            recordFailure(breakerKey);
            send({ type: 'error', message: 'Invalid response from Grok API' });
            if (!closed) controller.close();
            return;
          }

          const imagePrompt = extractGrokResponsesContent(validationResult.data);
          recordSuccess(breakerKey);

          // Cache the response if caching is enabled
          if (ENABLE_CACHING) {
            const db = getDb();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            try {
              await db
                .insert(xAccountCache)
                .values({
                  xHandle: handle.toLowerCase(),
                  searchResponse: completedResponse,
                  expiresAt,
                })
                .onConflictDoUpdate({
                  target: xAccountCache.xHandle,
                  set: {
                    searchResponse: completedResponse,
                    expiresAt,
                  },
                });
              console.log(`Cached search response for @${handle} until ${expiresAt.toISOString()}`);
            } catch (upsertError) {
              console.error('Cache upsert error:', upsertError);
              // Continue anyway - caching failure shouldn't break the flow
            }
          }

          if (!imagePrompt) {
            console.error('No prompt generated from Grok');
            send({ type: 'error', message: 'Failed to generate image prompt' });
            if (!closed) controller.close();
            return;
          }

          console.log('Generated prompt:', imagePrompt);
          send({ type: 'result', imagePrompt });
          if (!closed) controller.close();
        },
        cancel() {
          // Browser went away - stop the upstream call too
          clearTimeout(timeoutId);
          upstreamController.abort();
        },
      });

      return new Response(stream, { headers: sseHeaders(corsHeaders) });
    }
  } catch (error) {
    console.error('Error in analyze-account function:', error);
    return routeErrorResponse(error, corsHeaders);
  }
}
