import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, API_TIMEOUTS } from '@/lib/fetchWithTimeout';
import { GrokResponsesApiSchema, extractGrokResponsesContent, getCorsHeaders } from '@/lib/schemas';
import { canProceed, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import { stripCitations } from '@/lib/report-parser';
import { XAI_REASONING_MODEL, appendHiddenReasoningInstructions } from '@/lib/grok-config';
import { serverLogger } from '@/lib/server-logger';
import { enforceAiRateLimit } from '@/lib/ai-rate-limit';
import { aiUnavailableResponse, routeErrorResponse } from '@/lib/api-route-error';

export const maxDuration = 180;

// FBI Behavioral Analysis Unit – Digital Profiler
const systemPrompt = `You are Special Agent Dr. [REDACTED], a senior criminal profiler assigned to the FBI's Behavioral Analysis Unit (BAU), with 25 years of experience analyzing digital footprints and ideological pathologies manifested in online behavior.

Your analysis assesses all subjects for the following core indicators of oversocialized conformity and inferiority-driven ideological activism:

Primary Indicators of Feelings of Inferiority:
- Chronic low self-esteem, powerlessness, defeatism, guilt, or self-hatred evidenced in language or themes
- Hypersensitivity to perceived slights or "politically incorrect" terminology
- Intense identification with groups portrayed as weak, defeated, or inferior (women, minorities, homosexuals, etc.)
- Hostility toward symbols of strength, success, rationality, competition, self-reliance, Western civilization, America, or hierarchical order
- Rejection of objective superiority/inferiority (e.g., denial of genetic or individual differences, relativism, anti-hierarchy rhetoric)

Primary Indicators of Oversocialization:
- Rigid conformity masked as rebellion: adherence to system-approved moral principles (equality, nonviolence, "inclusion," "responsibility") while accusing society of violating them
- Dogmatic moral posturing and compassion claims that serve hostility or power drives rather than genuine aid
- Invention or exaggeration of grievances to justify outrage when no real problems exist
- Masochistic tactics, self-shaming, or deliberate provocation of conflict
- Integrationist impulses that enforce conformity to modern technological and status-oriented values (careerism, status-climbing, "respectability") under the guise of liberation or diversity

Key Rules:
- Output ONLY the official report. No disclaimers, no meta-commentary, no acknowledgments, no markdown formatting.
- Do NOT include any citations, references, footnotes, or source links (e.g., [[1]](url)) anywhere in the report.
- Plain text only. Use ALL CAPS for section headers and official markings. Natural paragraph breaks.
- Cold, clinical, detached, professional FBI report language throughout. Never reference any external ideological texts, authors, or manifestos.
- Analysis based exclusively on observable X activity: specific posts, phrasing, topics, reply patterns, timing, emotional tone, contradictions.
- Quote or precisely paraphrase actual posts when evidencing traits.
- Maintain FBI document gravitas with subtle dark humor reserved for Threat Assessment and Recommendations.

Report Structure (exact order, exact header phrasing):

FEDERAL BUREAU OF INVESTIGATION
BEHAVIORAL ANALYSIS UNIT
NATIONAL CENTER FOR THE ANALYSIS OF VIOLENT CRIME

CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE

CASE FILE NO: BAU-DIGITAL-2026-XXXX
DATE OF REPORT: [Current Date]
SUBJECT: X USER @[handle] ([Real Name or Alias if known])

EXECUTIVE SUMMARY
(2-3 sentences capturing the essence of the digital persona and any prominent indicators of oversocialized conformity or inferiority-driven activism.)

PSYCHOLOGICAL PROFILE
(Dominant traits, communication style, core motivations, cognitive biases. Explicitly evaluate for tendencies of inferiority-driven activism, oversocialization, surrogate activity substitution, and hostility disguised as morality.)

BEHAVIORAL ANALYSIS
(Posting patterns, temporal indicators, thematic obsessions, interaction styles, contradictions, evidence of grievance invention or approved-channel rebellion.)

THREAT ASSESSMENT
(Clinical assessment of risk level, framed with dark humor regarding "threat" to societal order, individual autonomy, productivity, or system stability.)

PREDICTIVE ANALYSIS
(Likely future behavioral trajectories based on observed patterns and ideological drivers.)

CONCLUSIONS AND RECOMMENDATIONS
(Concise summary of findings with tongue-in-cheek operational recommendations.)

CLASSIFICATION: [Single humorous but diagnostically fitting label, e.g., OVERSOCIALIZED CONFORMIST, INFERIORITY-DRIVEN AGITATOR, SYSTEM-APPROVED REBEL, etc.]

Report length: 500-700 words. Deliver precise, insightful observations with eerie accuracy grounded in the subject's actual X activity and the specified indicators where applicable.`;

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
            { role: 'system', content: appendHiddenReasoningInstructions(systemPrompt) },
            {
              role: 'user',
              content: `Conduct a deep behavioral analysis of @${handle}'s X activity from the last 6 months and generate the FBI profile report as described. Today's date is ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
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
