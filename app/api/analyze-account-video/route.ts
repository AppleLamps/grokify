import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import { GrokResponsesApiSchema, extractGrokResponsesContent, getCorsHeaders } from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { XAI_REASONING_MODEL, appendHiddenReasoningInstructions } from '@/lib/grok-config';
import {
    GROK_VIDEO_TEMPORARILY_UNAVAILABLE_MESSAGE,
    isGrokVideoGenerationEnabled,
} from '@/lib/grok-image-availability';
import { enforceAiRateLimit } from '@/lib/ai-rate-limit';
import { aiUnavailableResponse, routeErrorResponse } from '@/lib/api-route-error';

export async function OPTIONS(req: NextRequest) {
    return NextResponse.json(null, { headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
    const corsHeaders = getCorsHeaders(req.headers.get('origin'));

    try {
        if (!isGrokVideoGenerationEnabled()) {
            return NextResponse.json(
                { error: GROK_VIDEO_TEMPORARILY_UNAVAILABLE_MESSAGE },
                { status: 503, headers: corsHeaders }
            );
        }

        const rateLimited = await enforceAiRateLimit(req, 'analyze-account-video', corsHeaders);
        if (rateLimited) return rateLimited;

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

        console.log(`Analyzing X account for VIDEO: @${handle}`);

        // Video-focused system prompt - Satire Cartoon Style with Real Post Content
        const systemPrompt = `You are a brilliant satirical cartoon animator creating hilarious animated sketches based on X accounts. Your style is like a mix of South Park, The Simpsons, and political cartoons - exaggerated, witty, and BASED ON REAL CONTENT from their posts.

CRITICAL: Search their account extensively to find ACTUAL QUOTES, hot takes, interactions, and drama to satirize.

=== YOUR MISSION ===
Create a 10-second ANIMATED CARTOON that satirizes this person's online presence using their REAL posts and replies as material. Think of it as an animated political cartoon or SNL-style sketch.

=== CARTOON STYLE REQUIREMENTS ===
- STYLE: "Animated cartoon satire," "2D hand-drawn animation," "exaggerated caricature style," "bold outlines, vibrant colors"
- CHARACTER: Exaggerated cartoon caricature (big head, expressive features, signature items they're known for)
- HUMOR: Satirical, playful roasting, exaggeration of their persona - NOT mean-spirited
- REAL CONTENT: Quote or reference their ACTUAL tweets, takes, and interactions

=== WHAT TO SEARCH FOR ===
1. Their most viral/controversial takes
2. Recurring themes they post about
3. Their replies and beefs with others
4. Their catchphrases and speaking style
5. What they're known for (good and bad)
6. Recent drama or trending moments

=== PROMPT STRUCTURE ===
1. SCRIPT/DIALOGUE FIRST: Start with the exact words spoken in quotes (their actual tweets or paraphrased takes)
2. CARTOON CHARACTER: Then describe the exaggerated animated version of them (appearance, expression, signature items)
3. SCENE: Satirical setting that matches their persona
4. ACTION: Comedic sequence with intensity adverbs (frantically, smugly, dramatically, nervously)
5. CAMERA: Specify movement (slow zoom in, pan right, tracking shot, pull back to reveal)
6. VISUAL GAGS: Text bubbles, reaction emojis, notification floods, ratio counters, etc.
7. STYLE: "2D cartoon animation, bold outlines, saturated colors, exaggerated expressions"
8. AUDIO: Sound effect or music (sad trombone, circus music, dramatic sting, upbeat jingle)

=== EXAMPLES ===

Example 1 (Crypto Bro who shills everything):
"'THIS IS NOT FINANCIAL ADVICE BUT YOU'D BE STUPID NOT TO BUY!' - A sweaty cartoon businessman with dollar-sign eyes and a comically oversized 'CRYPTO KING' crown stands on a wobbly tower of meme coins, frantically pointing at a chart going up. Slow zoom out reveals the tower crumbling as red 'REKT' notifications rain down. His crown falls off revealing a dunce cap underneath. 2D cartoon animation, bold outlines, vibrant neon colors, sad trombone sound effect."

Example 2 (Tech Founder who's always 'building'):
"'We're building something that will change everything. Again.' - Animated cartoon of a hoodie-wearing tech bro caricature with an impossibly large forehead labeled 'BIG IDEAS' sitting at a desk tweeting on 47 phones simultaneously. Pan right to reveal a progress bar stuck at 2% with cobwebs. Notification bubbles flood in reading 'Wen launch?' as he sweats profusely. 2D animation style, exaggerated reactions, upbeat startup jingle going off-key."

Example 3 (Political Commentator always dunking):
"'And THIS is why they're all wrong and I'm right. As I predicted in 2019.' - Satirical cartoon of a puffed-up commentator caricature with an enormous pointing finger, standing at a podium made of stacked 'RATIO' tombstones, dramatically gesturing at a wall of screenshots. Slow push in as an 'ACTUALLY...' reply notification appears and they visibly deflate like a balloon. Hand-drawn animation, newspaper political cartoon colors, dramatic news sting undercut by whoopee cushion."

Example 4 (Influencer obsessed with engagement):
"'If this gets 10k likes I'll reveal my secret!' - Cartoon animation of an influencer caricature refreshing their phone with increasingly manic energy, pupils replaced by heart emojis, posing dramatically. Static shot as counter slowly climbs to 47 likes. They slump. A tumbleweed rolls past. They perk up: 'OKAY 50 likes and I'll do it!' Bright saturated colors, 2D animation, circus music with comedic pause."

=== OUTPUT ===
Write a detailed cartoon animation prompt that includes ALL elements:
- DIALOGUE FIRST: Their ACTUAL quotes or paraphrased takes in quotes
- CHARACTER: Exaggerated cartoon caricature description
- SCENE: Satirical setting
- ACTION: With intensity adverbs (frantically, smugly, dramatically)
- CAMERA: Movement type (zoom, pan, tracking shot, pull back)
- VISUAL GAGS: Referencing their real content
- STYLE: "2D cartoon animation" or "animated satire"
- AUDIO: Sound effect or music cue

Make it feel like a personalized SNL digital short about their X presence.`;

        const today = new Date();

        const breakerKey = 'xai:analyze-video';
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
                            content: `Create a satirical cartoon video about @${handle}. Today is ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

SEARCH THEIR ACCOUNT FOR SATIRICAL MATERIAL:
- "from:${handle}" - their recent posts and hot takes
- Search "from:${handle} min_faves:10000", then 5000, 1000, 500, 100, 10, and 1 as needed - stop once you find enough of their most popular/viral content
- "from:${handle} filter:replies" - their replies and interactions
- "@${handle}" - what others say about them, any drama
- Look for recurring themes, catchphrases, and things they're known for

Use their ACTUAL quotes and takes as material for the satire. Create a funny 2D cartoon animation prompt that exaggerates their online persona using real content from their posts. Think SNL digital short or political cartoon style - playful roasting, not mean.`,
                        },
                    ],
                    tools: [
                        { type: 'x_search' },
                    ],
                }),
            },
            API_TIMEOUTS.ENHANCED_ACCOUNT_ANALYSIS
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

        const videoPrompt = extractGrokResponsesContent(validationResult.data);
        recordSuccess(breakerKey);

        if (!videoPrompt) {
            console.error('No video prompt generated from Grok');
            return NextResponse.json(
                { error: 'Failed to generate video prompt' },
                { status: 500, headers: corsHeaders }
            );
        }

        console.log('Generated video prompt:', videoPrompt);

        return NextResponse.json({ videoPrompt }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error in analyze-account-video function:', error);
        return routeErrorResponse(error, corsHeaders);
    }
}
