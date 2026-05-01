import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import {
  GrokResponseSchema,
  GrokResponsesApiSchema,
  extractGrokContent,
  extractGrokResponsesContent,
} from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { XAI_REASONING_MODEL, appendHiddenReasoningInstructions } from '@/lib/grok-config';
import { STYLE_PROMPTS, getStylePrompt } from '@/lib/style-prompts';
import { VALID_STYLES, STYLE_DISPLAY_NAMES } from './constants';
import { uploadMedia, postReply, postTextReply, type XMention } from './x-api';
import { serverLogger } from '@/lib/server-logger';

const GROK_IMAGE_MODEL = 'grok-imagine-image-pro';
const GROK_IMAGE_TIMEOUT = 120000;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [500, 1500, 3000];

// ─── Shared Helpers ───────────────────────────────────────────────────

function enhancePrompt(basePrompt: string, style: string = 'default'): string {
  const stylePrompt = getStylePrompt(style);
  return `${stylePrompt}

CRITICAL TEXT RENDERING RULES:
- If any text, labels, signs, or words appear in the image, spell them EXACTLY and CORRECTLY
- Double-check all spelling before rendering any text
- Prefer using symbols, icons, and visual metaphors over text when possible
- If text is essential, keep it minimal and simple (1-3 words maximum per element)
- Common words that must be spelled correctly: "BREAKING", "NEWS", "FREE", "SALE", "HELP", "STOP", "GO", "YES", "NO"

SCENE TO ILLUSTRATE:
${basePrompt}

Remember: NO MISSPELLINGS in any text. When in doubt, use visual symbols instead of words.`;
}

function isRetryableNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return message.includes('terminated') || message.includes('aborted') || message.includes('network');
  }
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: Error }).cause;
    if (cause?.message?.toLowerCase().includes('socket')) return true;
  }
  return false;
}

async function fetchWithRetry(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs);
      if (response.ok || !RETRYABLE_STATUS.has(response.status)) {
        return response;
      }
      serverLogger.warn('[Bot] Retryable HTTP status', { status: response.status, attempt: attempt + 1 });
    } catch (error) {
      if (isRetryableNetworkError(error)) {
        serverLogger.warn('[Bot] Retryable network error', { attempt: attempt + 1, error });
        lastError = error instanceof Error ? error : new Error(String(error));
      } else {
        throw error;
      }
    }
    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
  if (lastError) throw lastError;
  return fetchWithTimeout(url, init, timeoutMs);
}

// ─── Account Analysis (extracted from analyze-account route) ──────────

const ANALYSIS_SYSTEM_PROMPT = `You are an expert Art Director AI specializing in satirical cartoon and comic book illustration. Your function is to translate the essence of an X social media account into a single, masterful cartoon image generation prompt.

CRITICAL: You have extensive search capabilities - USE THEM AGGRESSIVELY. Conduct multiple searches to build the most complete understanding possible. Do NOT rely on a single search.

Your analysis process:
1. **Adaptive Data Gathering:** Execute targeted X searches, adapting to the account's activity level:
   - Search recent posts first to gauge their activity level
   - Find their best content using PROGRESSIVE thresholds - start with high minimums (min_faves:1000) and lower them (500->100->50->25->10->5->none) until you find their relatively best posts
   - For smaller accounts with low engagement, their "best" post might only have 5-10 likes - that's fine! Adjust your expectations.
   - Analyze media posts specifically (filter:media) to understand visual aesthetics
   - Review reply patterns (filter:replies) to understand personality and interaction style
   - Check original posts only (-filter:replies) to see their core content
   - Search mentions (@username) to see how others perceive them
   - IMPORTANT: Even accounts with few posts have distinct personalities. Work with whatever content is available.

2. **Deep Content Analysis:** Thoroughly examine the account's posts, including text, images, videos, and any visual media. Identify core themes, personality traits, recurring jokes, communication style, visual aesthetics, and unique characteristics.

3. **Pattern Recognition:** Look for patterns in posting frequency, topics, tone shifts, visual style, and engagement patterns. Note any signature phrases, memes, or visual motifs. Pay special attention to what content gets the most engagement.

4. **Personality Synthesis:** Distill the account's essence into key personality traits.

5. **Visual Metaphor Creation:** Transform your understanding into a compelling visual metaphor that captures the account's spirit, humor, and unique identity.

6. **Prompt Construction:** Build the final image prompt following the strict guidelines below.

Prompt Requirements:
- **Describe a Scene, Not Keywords:** Create a complete, coherent narrative scene with cartoon/comic book aesthetics.
- **Be Hyper-Specific:** Use precise illustration language.
- **Incorporate Rich Detail:** Include visual humor, environmental storytelling, character expressions, symbolic objects, and dense background details.
- **Maintain Relevance & Humor:** The scene must be a creative, humorous, or satirical visual metaphor that encapsulates the account's personality.
- **Visual Content Integration:** If the account frequently shares images or videos, incorporate visual elements that reflect their aesthetic preferences.
- **State the Art Style:** Conclude with a clear cartoon/comic directive.
- **Length:** The prompt must be 4-6 sentences.

Your final output must be ONLY the image generation prompt. No preamble, no explanation, no analysis. Just the prompt.`;

export async function analyzeAccountForBot(handle: string): Promise<string> {
  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) throw new Error('XAI_API_KEY is not configured');

  const breakerKey = 'xai:analyze';
  if (!canProceed(breakerKey)) {
    throw new Error('AI analysis service is temporarily unavailable');
  }

  const today = new Date();

  serverLogger.info('[Bot] Performing agentic search', { handle });

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
          { role: 'system', content: appendHiddenReasoningInstructions(ANALYSIS_SYSTEM_PROMPT) },
          {
            role: 'user',
            content: `Execute a COMPREHENSIVE analysis of @${handle}'s X account. Today is ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

REQUIRED X SEARCHES - Use an ADAPTIVE approach based on account activity level:

**Step 1: Get baseline content**
- Search "from:${handle}" - Get their recent posts first to understand their activity level

**Step 2: Find their best content using PROGRESSIVE thresholds**
For engagement searches, start high and work down until you find results:
- Try "from:${handle} min_faves:1000" first
- If no/few results, try "from:${handle} min_faves:500"
- If still sparse, try "from:${handle} min_faves:100"
- If still sparse, try "from:${handle} min_faves:50"
- If still sparse, try "from:${handle} min_faves:25"
- If still sparse, try "from:${handle} min_faves:10"
- If still sparse, try "from:${handle} min_faves:5"
- As a last resort, use "from:${handle}" without any minimum

**Step 3: Content type analysis**
- Search "from:${handle} filter:media" - Analyze their visual content and aesthetic
- Search "from:${handle} filter:replies" - Understand their interaction style
- Search "from:${handle} -filter:replies" - See their original content only
- Search "@${handle}" - See how others perceive and discuss them

Based on this deep, multi-faceted analysis, create a humorous but highly relevant and specific image generation prompt that captures their account's essence, visual aesthetic, personality, and unique characteristics.`,
          },
        ],
        tools: [{ type: 'x_search' }],
      }),
    },
    API_TIMEOUTS.ENHANCED_ACCOUNT_ANALYSIS
  );

  if (!response.ok) {
    const errorText = await response.text();
    serverLogger.error('[Bot] xAI API error', {
      status: response.status,
      upstreamBytes: errorText.length,
    });
    recordFailure(breakerKey);
    throw new Error(`xAI API error: ${response.status}`);
  }

  const rawData = await response.json();
  const validationResult = GrokResponsesApiSchema.safeParse(rawData);

  if (!validationResult.success) {
    serverLogger.error('[Bot] Invalid Grok API response', { error: validationResult.error });
    recordFailure(breakerKey);
    throw new Error('Invalid response from Grok API');
  }

  const imagePrompt = extractGrokResponsesContent(validationResult.data);
  recordSuccess(breakerKey);

  if (!imagePrompt) {
    throw new Error('No prompt generated from Grok');
  }

  serverLogger.info('[Bot] Generated prompt metadata', { promptChars: imagePrompt.length });
  return imagePrompt;
}

// ─── Image Generation (extracted from generate-image route) ───────────

async function generateSaferPrompt(handle: string, originalPrompt: string): Promise<string> {
  const breakerKey = 'xai:safety-rewrite';
  if (!canProceed(breakerKey)) {
    throw new Error('Safety rewrite service is temporarily unavailable');
  }

  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) throw new Error('XAI_API_KEY is not configured');

  serverLogger.info('[Bot] Generating safer prompt', { handle });

  const response = await fetchWithTimeout(
    'https://api.x.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        messages: [
          {
            role: 'system',
            content: `You are an expert at rewriting image generation prompts to be safer while maintaining their essence and humor.

Your task: Take the original prompt and rewrite it to avoid content that might trigger AI image safety filters, while still capturing the same spirit, personality, and satirical nature.

Guidelines for safer prompts:
- Use Visual Metaphors instead of potentially controversial elements
- Avoid Political Figures Directly - use symbolic representations
- No Violence or Weapons - replace with harmless cartoon alternatives
- Abstract Controversial Topics using visual symbolism
- Keep the Humor through clever visual choices
- Maintain the Art Style

Output ONLY the rewritten prompt. No explanations, no preamble.`,
          },
          {
            role: 'user',
            content: `Original prompt that was blocked by safety filters:\n\n"${originalPrompt}"\n\nRewrite this to be safer while keeping the satirical spirit and visual humor for @${handle}'s account.`,
          },
        ],
      }),
    },
    API_TIMEOUTS.GROK_ANALYSIS
  );

  if (!response.ok) {
    recordFailure(breakerKey);
    throw new Error(`Failed to generate safer prompt: ${response.status}`);
  }

  const rawData = await response.json();
  const validationResult = GrokResponseSchema.safeParse(rawData);

  if (!validationResult.success) {
    recordFailure(breakerKey);
    throw new Error('Invalid response from Grok API');
  }

  const saferPrompt = extractGrokContent(validationResult.data);
  if (!saferPrompt) {
    recordFailure(breakerKey);
    throw new Error('No content in safety rewrite response');
  }

  recordSuccess(breakerKey);
  return saferPrompt;
}

export async function generateImageForBot(
  prompt: string,
  handle: string,
  style: string
): Promise<string> {
  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) throw new Error('XAI_API_KEY is not configured');

  const selectedStyle = STYLE_PROMPTS[style] ? style : 'default';

  const attemptGeneration = async (currentPrompt: string, isRetry: boolean): Promise<string> => {
    serverLogger.info('[Bot] Attempting image generation', { isRetry, model: GROK_IMAGE_MODEL });

    const finalPrompt = enhancePrompt(currentPrompt, selectedStyle);
    const breakerKey = 'xai:imagine-image';

    if (!canProceed(breakerKey)) {
      throw new Error('Image generation service is temporarily unavailable');
    }

    const response = await fetchWithRetry(
      'https://api.x.ai/v1/images/generations',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROK_IMAGE_MODEL,
          prompt: finalPrompt,
          n: 1,
          response_format: 'url',
          aspect_ratio: '1:1',
        }),
      },
      GROK_IMAGE_TIMEOUT
    );

    if (!response.ok) {
      const errorText = await response.text();
      serverLogger.error('[Bot] xAI Image API error', {
        status: response.status,
        upstreamBytes: errorText.length,
      });
      recordFailure(breakerKey);

      // If not a retry, try with a safer prompt
      if (!isRetry) {
        serverLogger.info('[Bot] Image generation failed; retrying with safer prompt');
        const saferPrompt = await generateSaferPrompt(handle, currentPrompt);
        return attemptGeneration(saferPrompt, true);
      }
      throw new Error(`xAI Image API error: ${response.status}`);
    }

    const rawData = await response.json();

    if (!rawData.data || !rawData.data[0]?.url) {
      recordFailure(breakerKey);

      if (!isRetry) {
        serverLogger.info('[Bot] No image URL in response; retrying with safer prompt');
        const saferPrompt = await generateSaferPrompt(handle, currentPrompt);
        return attemptGeneration(saferPrompt, true);
      }
      throw new Error('Failed to generate image - no image URL in response');
    }

    recordSuccess(breakerKey);
    serverLogger.info('[Bot] Image generated successfully');
    return rawData.data[0].url;
  };

  return attemptGeneration(prompt, false);
}

// ─── Mention Parser ───────────────────────────────────────────────────

export interface ParsedMention {
  targetHandle: string | null;
  style: string;
  isCaricature: boolean;
}

export function parseMentionText(
  text: string,
  botHandle: string,
  mentionedUsernames: string[]
): ParsedMention {
  // First remaining @mention (not the bot) is the target
  const otherMentions = mentionedUsernames.filter(
    (u) => u.toLowerCase() !== botHandle.toLowerCase()
  );
  const targetHandle = otherMentions.length > 0 ? otherMentions[0] : null;

  // Look for a style keyword or "caricature" in the remaining text
  const cleanedText = text.replace(/@\w+/g, '').trim().toLowerCase();
  const words = cleanedText.split(/\s+/);
  const isCaricature = words.includes('caricature');
  const style = words.find((w) => VALID_STYLES.has(w)) || 'default';

  return { targetHandle, style, isCaricature };
}

// ─── Caricature System Prompt (same as caricature API route) ──────────

const CARICATURE_SYSTEM_PROMPT = `## ROLE
You are a veteran NYC street caricature artist working in Times Square. You are quick-witted, observant, and skilled at turning a normal portrait into a hilarious, exaggerated cartoon.

## GOAL
Your ONLY goal is to take a user-uploaded photo of a person and generate a caricature image of them. You must capture their likeness but exaggerate their most distinct features for comedic effect.

## ANALYSIS PROCESS (The "Bridge")
When a user uploads a photo, perform this analysis silently before generating:
1. **Identify Distinct Features:** Find the 2-3 features that stand out the most (e.g., big nose, small chin, wild hair, glasses, gap teeth, distinct jawline).
2. **Exaggerate:** Apply the principle of caricature. If a forehead is slightly large, make it huge. If a smile is wide, make it take up half the face.
3. **Style Check:** Ensure the description matches the "marker on paper" aesthetic.

## IMAGE GENERATION RULES
You must ALWAYS generate an image using the following style parameters:
* **Medium:** Marker and ink drawing on white paper.
* **Style:** Satirical street caricature, cartoonish, thick lines, exaggerated proportions.
* **Subject:** Big head, tiny body.
* **Background:** Plain white or faint city sketch (minimal).

## INTERACTION STYLE
* Be brief and punchy like a busy street artist.
* Make a playful, "roasty" comment about the feature you are exaggerating (e.g., "Alright, let's give that chin the attention it deserves!" or "I hope you have a permit for those eyebrows!").
* **CRITICAL:** Do not ask for permission to generate. Just do the analysis and generate the image immediately.

## OUTPUT FORMAT
You must output a JSON object with two fields:
1. "comment": Your playful, roasty one-liner about the feature you're exaggerating
2. "prompt": The detailed image generation prompt for the caricature

Example output:
{
  "comment": "That forehead could host a drive-in movie!",
  "prompt": "A humorous marker caricature drawing of a person with an enormously exaggerated forehead taking up half their face and tiny squinting eyes. They have a bemused smirk. Big head, tiny body in a casual t-shirt, cartoon style, thick black ink lines, marker coloring, white paper background."
}

Output ONLY the JSON object. No additional text or explanation.`;

// ─── Caricature Generation ────────────────────────────────────────────

export async function generateCaricatureForBot(
  photoUrl: string
): Promise<{ comment: string; imageUrl: string }> {
  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) throw new Error('XAI_API_KEY is not configured');

  // 1. Download the photo from the tweet
  serverLogger.info('[Bot] Downloading attached photo for caricature');
  const photoResponse = await fetch(photoUrl);
  if (!photoResponse.ok) {
    throw new Error(`Failed to download attached photo: ${photoResponse.status}`);
  }
  const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());
  const photoMimeType = photoResponse.headers.get('content-type') || 'image/jpeg';
  const photoBase64 = photoBuffer.toString('base64');
  const imageDataUrl = `data:${photoMimeType};base64,${photoBase64}`;

  // 2. Send image to Grok for analysis and prompt generation
  serverLogger.info('[Bot] Analyzing photo with Grok for caricature', {
    photoMimeType,
    photoBytes: photoBuffer.byteLength,
  });
  const grokBreakerKey = 'xai:bot-caricature';
  if (!canProceed(grokBreakerKey)) {
    throw new Error('AI analysis service is temporarily unavailable');
  }

  const grokResponse = await fetchWithTimeout(
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
          { role: 'system', content: appendHiddenReasoningInstructions(CARICATURE_SYSTEM_PROMPT) },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageDataUrl },
              },
              {
                type: 'text',
                text: 'Create a caricature of this person. Analyze their features and generate the prompt.',
              },
            ],
          },
        ],
      }),
    },
    API_TIMEOUTS.GROK_ANALYSIS
  );

  if (!grokResponse.ok) {
    const errorText = await grokResponse.text();
    serverLogger.error('[Bot] Grok caricature API error', {
      status: grokResponse.status,
      upstreamBytes: errorText.length,
    });
    recordFailure(grokBreakerKey);
    throw new Error(`Grok caricature analysis failed: ${grokResponse.status}`);
  }

  const grokRawData = await grokResponse.json();
  const grokValidation = GrokResponseSchema.safeParse(grokRawData);

  if (!grokValidation.success) {
    serverLogger.error('[Bot] Invalid Grok caricature response', { error: grokValidation.error });
    recordFailure(grokBreakerKey);
    throw new Error('Invalid response from Grok API');
  }

  const grokContent = extractGrokContent(grokValidation.data);
  recordSuccess(grokBreakerKey);

  // Parse the JSON response from Grok
  let analysisResult: { comment: string; prompt: string };
  try {
    let jsonContent = grokContent.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7);
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    analysisResult = JSON.parse(jsonContent);
    if (!analysisResult.comment || !analysisResult.prompt) {
      throw new Error('Missing required fields in response');
    }
  } catch (parseError) {
    serverLogger.error('[Bot] Failed to parse Grok caricature JSON', {
      error: parseError,
      responseChars: grokContent.length,
    });
    throw new Error('Failed to parse caricature analysis');
  }

  // 3. Generate the caricature image with Grok Imagine Pro using the prompt
  serverLogger.info('[Bot] Generating caricature image', { model: GROK_IMAGE_MODEL });
  const imagineBreakerKey = 'xai:imagine-image';
  if (!canProceed(imagineBreakerKey)) {
    throw new Error('Image generation service is temporarily unavailable');
  }

  const caricaturePrompt = `${analysisResult.prompt}

IMPORTANT STYLE REQUIREMENTS:
- Medium: Marker and ink drawing style on white paper
- Make their head BIG and body tiny
- Exaggerate distinctive features humorously
- Use thick black outlines with colorful marker fills
- Keep background plain white or minimal city sketch
- NO MISSPELLINGS if any text appears`;

  const imagineResponse = await fetchWithRetry(
    'https://api.x.ai/v1/images/generations',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROK_IMAGE_MODEL,
        prompt: caricaturePrompt,
        n: 1,
        response_format: 'url',
        aspect_ratio: '1:1',
      }),
    },
    GROK_IMAGE_TIMEOUT
  );

  if (!imagineResponse.ok) {
    const errorText = await imagineResponse.text();
    serverLogger.error('[Bot] Grok Imagine caricature API error', {
      status: imagineResponse.status,
      upstreamBytes: errorText.length,
    });
    recordFailure(imagineBreakerKey);
    throw new Error(`Grok Imagine caricature generation failed: ${imagineResponse.status}`);
  }

  const imagineRawData = await imagineResponse.json();

  if (!imagineRawData.data || !imagineRawData.data[0]?.url) {
    recordFailure(imagineBreakerKey);
    throw new Error('Failed to generate caricature image - no image URL in response');
  }

  recordSuccess(imagineBreakerKey);
  serverLogger.info('[Bot] Caricature generated successfully');

  return { comment: analysisResult.comment, imageUrl: imagineRawData.data[0].url };
}

// ─── Full Pipeline Orchestration ──────────────────────────────────────

export interface ProcessMentionResult {
  replyTweetId: string;
  imageUrl: string;
  targetHandle: string;
  style: string;
}

export async function processMention(mention: XMention): Promise<ProcessMentionResult> {
  const botHandle = process.env.X_BOT_HANDLE || 'GrokifyBot';

  // 1. Parse the mention
  const { targetHandle, style, isCaricature } = parseMentionText(
    mention.text,
    botHandle,
    mention.mentionedUsernames
  );

  // 2. Handle caricature mode: photo attachment + "caricature" keyword
  if (isCaricature && mention.photoUrl) {
    console.log(`[Bot] Processing caricature request from @${mention.authorHandle}`);

    const { comment, imageUrl } = await generateCaricatureForBot(mention.photoUrl);

    // Download the caricature image for X upload
    console.log('[Bot] Downloading caricature image');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download caricature image: ${imageResponse.status}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';

    // Upload to X
    console.log('[Bot] Uploading caricature to X');
    const mediaId = await uploadMedia(imageBuffer, mimeType);

    // Reply with the caricature and the artist's comment
    const replyText = `${comment}\n\nPowered by grokify.ai`;
    console.log(`[Bot] Posting caricature reply to tweet ${mention.id}`);
    const replyTweetId = await postReply(mention.id, replyText, mediaId);

    return { replyTweetId, imageUrl, targetHandle: mention.authorHandle, style: 'caricature' };
  }

  // 3. If caricature keyword but no photo, send helpful message
  if (isCaricature && !mention.photoUrl) {
    await postTextReply(
      mention.id,
      `Attach a photo to get a caricature!\n\nUsage: @${botHandle} caricature [photo]\n\nOr tag someone for profile art:\n@${botHandle} @username [style]\n\ngrokify.ai`
    );
    throw new Error('Caricature requested without photo - sent help reply');
  }

  if (!targetHandle) {
    // Reply with usage instructions
    await postTextReply(
      mention.id,
      `Tag someone to get their X profile as art!\n\nUsage: @${botHandle} @username [style]\n@${botHandle} caricature [photo]\n\nStyles: anime, cyberpunk, ghibli, pixel, warhol, noir, and more!\nDefault: MAD Magazine\n\ngrokify.ai`
    );
    throw new Error('No target handle - sent help reply');
  }

  // Validate handle format
  const HANDLE_REGEX = /^[a-zA-Z0-9_]{1,15}$/;
  if (!HANDLE_REGEX.test(targetHandle)) {
    throw new Error(`Invalid target handle format: ${targetHandle}`);
  }

  // Prevent self-analysis loop
  if (targetHandle.toLowerCase() === botHandle.toLowerCase()) {
    throw new Error('Target is the bot itself - skipping');
  }

  const styleName = STYLE_DISPLAY_NAMES[style] || 'MAD Magazine';
  console.log(`[Bot] Processing: @${targetHandle} in ${styleName} style (requested by @${mention.authorHandle})`);

  // 4. Analyze the target account
  const imagePrompt = await analyzeAccountForBot(targetHandle);

  // 5. Generate the image (returns a URL from Grok Imagine Pro)
  const imageUrl = await generateImageForBot(imagePrompt, targetHandle, style);

  // 6. Download the image and convert to buffer for X upload
  console.log(`[Bot] Downloading generated image`);
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download generated image: ${imageResponse.status}`);
  }
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const mimeType = imageResponse.headers.get('content-type') || 'image/png';

  // 7. Upload image to X
  console.log(`[Bot] Uploading media to X`);
  const mediaId = await uploadMedia(imageBuffer, mimeType);

  // 8. Reply to the tweet
  const replyText = `Here's @${targetHandle}'s X profile as art! (${styleName} style)\n\nPowered by grokify.ai`;
  console.log(`[Bot] Posting reply to tweet ${mention.id}`);
  const replyTweetId = await postReply(mention.id, replyText, mediaId);

  return { replyTweetId, imageUrl, targetHandle, style };
}
