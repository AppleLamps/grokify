import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import { GrokResponsesApiSchema, extractGrokResponsesContent, getCorsHeaders } from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { XAI_REASONING_MODEL, appendHiddenReasoningInstructions } from '@/lib/grok-config';

export async function OPTIONS() {
  return NextResponse.json(null, { headers: getCorsHeaders() });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders();

  try {
    const { handle1, handle2 } = await req.json();

    // Validate X handle format (1-15 alphanumeric characters + underscores)
    const HANDLE_REGEX = /^[a-zA-Z0-9_]{1,15}$/;
    
    if (!handle1 || !HANDLE_REGEX.test(handle1)) {
      console.error('Invalid handle1 format:', handle1);
      return NextResponse.json(
        { error: 'Invalid first X handle format. Handles must be 1-15 characters and contain only letters, numbers, and underscores.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!handle2 || !HANDLE_REGEX.test(handle2)) {
      console.error('Invalid handle2 format:', handle2);
      return NextResponse.json(
        { error: 'Invalid second X handle format. Handles must be 1-15 characters and contain only letters, numbers, and underscores.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (handle1.toLowerCase() === handle2.toLowerCase()) {
      return NextResponse.json(
        { error: 'Please enter two different usernames.' },
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

    console.log(`Analyzing X accounts for joint pic: @${handle1} & @${handle2}`);

    // System prompt for creative joint pic generation
    const systemPrompt = `You are an expert Art Director AI specializing in satirical cartoon and comic book illustration. Your function is to analyze TWO X social media accounts and create a SINGLE masterful cartoon image generation prompt that creatively represents BOTH accounts together.

CRITICAL: You have extensive search capabilities - USE THEM AGGRESSIVELY. Conduct multiple searches for BOTH accounts to build the most complete understanding possible.

Your analysis process:
1. **Analyze BOTH Accounts Thoroughly:** Execute targeted X searches for each account:
   - Search recent posts from both accounts
   - Find their best/most engaged content using progressive thresholds
   - Analyze their media posts, reply patterns, and original content
   - Understand each account's personality, themes, and visual aesthetic

2. **Find Connection Points:** After analyzing both accounts, identify:
   - Shared interests, topics, or themes they both care about
   - Contrasting elements that could create visual tension or humor
   - Potential interactions or conversations between them
   - How their personalities might complement or clash

3. **Creative Fusion:** Design a scene that MEANINGFULLY represents BOTH accounts:
   - Both should be equally prominent in the scene
   - Use visual metaphors that capture each account's essence
   - Create a narrative or situation that makes sense for both
   - The scene should feel like a natural "crossover episode"

4. **Prompt Construction:** Build the final image prompt following these guidelines:

Prompt Requirements:
- **BOTH Accounts Must Be Represented:** The scene must feature visual elements/characters representing BOTH accounts, not just one
- **Describe a Unified Scene:** Create a coherent narrative that brings both accounts together in a creative way
- **Be Hyper-Specific:** Use precise illustration language with bold outlines, exaggerated expressions, vibrant colors, halftone shading, dynamic action lines
- **Incorporate Rich Detail:** Include visual humor, environmental storytelling, character expressions, and symbolic objects representing BOTH accounts
- **Connection is Key:** The image should tell a story about the relationship or contrast between these two accounts
- **State the Art Style:** Conclude with a clear cartoon/comic directive (e.g., "MAD Magazine style satirical cartoon with two distinct characters")
- **Length:** The prompt must be 4-6 sentences—comprehensive but concise.

Examples of masterful joint prompts:
- "A split-panel comic showing two contrasting characters: on the left, a chaos-loving tech maverick with lightning bolts around their keyboard and crypto symbols floating in the air; on the right, a methodical investor in a suit calmly reading charts while sipping tea. They meet in the middle where their worlds collide in a spectacular explosion of memes, graphs, and flying coffee cups. Bold comic book illustration style with vibrant colors, thick black outlines, and halftone shading."
- "Two cartoon characters racing side-by-side on rocket-powered office chairs through a surreal Silicon Valley landscape filled with floating app icons and coffee cup obstacles. One wears a hoodie covered in code snippets while the other sports a business suit with motivational quotes printed on it. They're both reaching for a giant golden trophy shaped like a 'Like' button. MAD Magazine style satirical cartoon with exaggerated expressions and dynamic motion lines."

Your final output must be ONLY the image generation prompt. No preamble, no explanation, no analysis. Just the prompt.`;

    const today = new Date();

    // Perform agentic search with tools for BOTH accounts
    console.log(`Performing agentic search for @${handle1} and @${handle2}`);

    const breakerKey = 'xai:joint';
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
              content: `Execute a COMPREHENSIVE analysis of TWO X accounts: @${handle1} and @${handle2}. Today is ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

REQUIRED X SEARCHES FOR BOTH ACCOUNTS:

**For @${handle1}:**
- Search "from:${handle1}" - Get their recent posts
- Search "from:${handle1} min_faves:100" (lower threshold if needed) - Find their best content
- Search "from:${handle1} filter:media" - Analyze their visual content
- Search "from:${handle1} -filter:replies" - See their original content
- Search "@${handle1}" - See how others perceive them

**For @${handle2}:**
- Search "from:${handle2}" - Get their recent posts
- Search "from:${handle2} min_faves:100" (lower threshold if needed) - Find their best content
- Search "from:${handle2} filter:media" - Analyze their visual content
- Search "from:${handle2} -filter:replies" - See their original content
- Search "@${handle2}" - See how others perceive them

**IMPORTANT - Finding Connections:**
After analyzing both accounts, think about:
1. What themes or topics do they BOTH care about?
2. How are their personalities similar or different?
3. What would happen if they were in the same room/scene together?
4. What visual metaphors could represent each of them?

Based on this deep analysis of BOTH accounts, create a creative, humorous image generation prompt that:
- Features visual representations of BOTH @${handle1} and @${handle2}
- Places them in a unified scene that captures their dynamic
- Highlights interesting connections, contrasts, or interactions between them
- Is highly specific, satirical, and visually rich`,
            },
          ],
          tools: [
            { type: 'x_search' },
          ],
        }),
      },
      API_TIMEOUTS.ENHANCED_ACCOUNT_ANALYSIS * 1.5 // Allow more time for two accounts
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('xAI API error:', response.status, errorText);
      recordFailure(breakerKey);
      return NextResponse.json(
        { error: `xAI API error: ${response.status}`, details: errorText },
        { status: response.status, headers: corsHeaders }
      );
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

    const imagePrompt = extractGrokResponsesContent(validationResult.data);

    if (!imagePrompt) {
      console.error('No prompt generated from Grok');
      return NextResponse.json(
        { error: 'Failed to generate image prompt' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Generated joint prompt:', imagePrompt);

    recordSuccess(breakerKey);
    return NextResponse.json({ imagePrompt }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in joint-pic function:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}
