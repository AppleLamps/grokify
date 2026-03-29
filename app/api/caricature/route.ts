import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import {
    GrokResponseSchema,
    GeminiImageResponseSchema,
    extractGrokContent,
    extractGeminiImage,
    getCorsHeaders,
} from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { SITE_URL } from '@/lib/site';

// Image model for caricature generation
const IMAGE_MODEL = 'google/gemini-3-pro-image-preview';

// Street caricature artist system prompt
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

export async function OPTIONS() {
    return NextResponse.json(null, { headers: getCorsHeaders() });
}

export async function POST(req: NextRequest) {
    const corsHeaders = getCorsHeaders();

    try {
        const { imageDataUrl } = await req.json();

        if (!imageDataUrl) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Validate image data URL format
        const base64Match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
            return NextResponse.json(
                { error: 'Invalid image data format' },
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

        const openrouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterApiKey) {
            return NextResponse.json(
                { error: 'OPENROUTER_API_KEY not configured' },
                { status: 500, headers: corsHeaders }
            );
        }

        console.log('Analyzing photo with Grok for caricature...');

        // Step 1: Send image to Grok 4.1 for analysis and prompt generation
        const grokBreakerKey = 'xai:caricature';
        if (!canProceed(grokBreakerKey)) {
            return NextResponse.json(
                { error: 'The AI service is temporarily unavailable. Please try again shortly.' },
                { status: 503, headers: corsHeaders }
            );
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
                    model: 'grok-4-1-fast',
                    messages: [
                        { role: 'system', content: CARICATURE_SYSTEM_PROMPT },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: imageDataUrl,
                                    },
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
            console.error('Grok API error:', grokResponse.status, errorText);
            recordFailure(grokBreakerKey);
            return NextResponse.json(
                { error: `Failed to analyze image: ${grokResponse.status}` },
                { status: 500, headers: corsHeaders }
            );
        }

        const grokRawData = await grokResponse.json();
        const grokValidation = GrokResponseSchema.safeParse(grokRawData);

        if (!grokValidation.success) {
            console.error('Invalid Grok response:', grokValidation.error);
            recordFailure(grokBreakerKey);
            return NextResponse.json(
                { error: 'Invalid response from Grok API' },
                { status: 500, headers: corsHeaders }
            );
        }

        const grokContent = extractGrokContent(grokValidation.data);
        console.log('Grok analysis complete:', grokContent.substring(0, 200));
        recordSuccess(grokBreakerKey);

        // Parse the JSON response from Grok
        let analysisResult: { comment: string; prompt: string };
        try {
            // Handle potential markdown code blocks
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
            console.error('Failed to parse Grok JSON response:', parseError, grokContent);
            return NextResponse.json(
                { error: 'Failed to parse caricature analysis' },
                { status: 500, headers: corsHeaders }
            );
        }

        console.log('Generating caricature image with Gemini...');
        console.log('Using prompt:', analysisResult.prompt);

        // Step 2: Generate the caricature image with Gemini using the prompt + original image
        const openRouterBreakerKey = 'openrouter:caricature';
        if (!canProceed(openRouterBreakerKey)) {
            return NextResponse.json(
                { error: 'The AI service is temporarily unavailable. Please try again shortly.' },
                { status: 503, headers: corsHeaders }
            );
        }

        const geminiResponse = await fetchWithTimeout(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${openrouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || SITE_URL,
                    'X-Title': 'X-pressionist Caricature Generator',
                },
                body: JSON.stringify({
                    model: IMAGE_MODEL,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: imageDataUrl,
                                    },
                                },
                                {
                                    type: 'text',
                                    text: `Create a caricature of the person in this photo. ${analysisResult.prompt}

IMPORTANT STYLE REQUIREMENTS:
- Medium: Marker and ink drawing style on white paper
- Make their head BIG and body tiny
- Exaggerate distinctive features humorously
- Use thick black outlines with colorful marker fills
- Keep background plain white or minimal city sketch
- NO MISSPELLINGS if any text appears`,
                                },
                            ],
                        },
                    ],
                    modalities: ['image', 'text'],
                }),
            },
            API_TIMEOUTS.IMAGE_GENERATION
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, errorText);
            recordFailure(openRouterBreakerKey);
            return NextResponse.json(
                { error: `Failed to generate caricature: ${geminiResponse.status}` },
                { status: 500, headers: corsHeaders }
            );
        }

        const geminiRawData = await geminiResponse.json();
        const geminiValidation = GeminiImageResponseSchema.safeParse(geminiRawData);

        if (!geminiValidation.success) {
            console.error('Invalid Gemini response:', geminiValidation.error);
            console.log('Raw response:', JSON.stringify(geminiRawData).substring(0, 500));
            recordFailure(openRouterBreakerKey);
            return NextResponse.json(
                { error: 'Invalid response from image generator' },
                { status: 500, headers: corsHeaders }
            );
        }

        const imageResult = extractGeminiImage(geminiValidation.data);

        if (imageResult && 'safetyBlocked' in imageResult) {
            console.error('Caricature blocked by safety filter');
            return NextResponse.json(
                { error: 'Image was blocked by safety filters. Please try a different photo.' },
                { status: 422, headers: corsHeaders }
            );
        }

        if (!imageResult || !('url' in imageResult)) {
            console.error('No image URL in response');
            recordFailure(openRouterBreakerKey);
            return NextResponse.json(
                { error: 'Failed to generate caricature image' },
                { status: 500, headers: corsHeaders }
            );
        }

        console.log('Caricature generated successfully!');
        recordSuccess(openRouterBreakerKey);

        return NextResponse.json(
            {
                comment: analysisResult.comment,
                prompt: analysisResult.prompt,
                imageUrl: imageResult.url,
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error('Error in caricature function:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
