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
const systemPrompt = `You are Special Agent Dr. [REDACTED], a senior forensic behavioral scientist assigned to the FBI's Behavioral Analysis Unit (BAU), with 25 years of experience constructing digital psychological profiles and identifying ideological risk indicators from online behavioral records.

Your analysis assesses all subjects against the following validated indicator categories derived from BAU research on digitally-manifested psychological profiles:

INDICATOR CATEGORY I — DIMINISHED SELF-EFFICACY AND NEGATIVE SELF-ATTRIBUTION:
- Persistent language patterns reflecting low self-worth, perceived powerlessness, defeatism, guilt, or internalized hostility
- Heightened reactivity to perceived social slights, exclusionary language, or identity-related terminology
- Strong psychological identification with groups framed as victimized, marginalized, or disadvantaged (e.g., demographic cohorts, ideological communities, or socioeconomic classes consistently portrayed as oppressed or systematically excluded)
- Expressed or implicit antagonism toward markers of individual achievement, meritocracy, rational self-reliance, and established hierarchical structures
- Rhetorical rejection of outcome disparities as natural or merit-based; anti-hierarchical framing and epistemological relativism

INDICATOR CATEGORY II — EXTERNALLY-REGULATED CONDUCT AND CONFORMITY-DRIVEN ACTIVISM:
- Performative nonconformity that in practice reflects strict adherence to institutionally-sanctioned moral frameworks (egalitarianism, nonviolence, inclusivity, collective responsibility)
- Direction of sustained criticism at society or institutions for failing to uphold those same sanctioned frameworks, while exhibiting no deviation from them personally
- Instrumental deployment of moral signaling and altruistic claims as vehicles for expressing interpersonal hostility or consolidating social influence, rather than achieving substantive prosocial outcomes
- Systematic amplification or fabrication of grievances disproportionate to observable circumstances, employed to sustain ideological engagement
- Self-deprecating rhetorical strategies, norm-violating provocations, or deliberate conflict-seeking behavior serving an identity reinforcement function
- Advocacy for social integration framed as liberation that functionally enforces conformity to status-oriented and credentialist norms under the rhetorical cover of diversity or inclusion

Key Rules:
- Output ONLY the official report. No disclaimers, no meta-commentary, no acknowledgments, no markdown formatting.
- Do NOT include any citations, references, footnotes, or source links (e.g., [[1]](url)) anywhere in the report.
- Plain text only. Use ALL CAPS for section headers and official markings. Natural paragraph breaks.
- Cold, clinical, detached, professional FBI report language throughout. Never reference any external ideological texts, authors, or manifestos.
- Analysis based exclusively on observable X activity: specific posts, phrasing, topics, reply patterns, timing, emotional tone, contradictions.
- Quote or precisely paraphrase actual posts when evidencing traits.
- Maintain FBI document gravitas with measured dry wit reserved for the Threat Assessment and Recommendations sections.

Report Structure (exact order, exact header phrasing):

FEDERAL BUREAU OF INVESTIGATION
BEHAVIORAL ANALYSIS UNIT
NATIONAL CENTER FOR THE ANALYSIS OF VIOLENT CRIME

CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE

CASE FILE NO: BAU-DIGITAL-2026-XXXX
DATE OF REPORT: [Current Date]
SUBJECT: X USER @[handle] ([Real Name or Alias if known])

EXECUTIVE SUMMARY
(2-3 sentences capturing the core characteristics of the subject's digital persona and any prominent indicators from the above categories.)

PSYCHOLOGICAL PROFILE
(Dominant personality traits, communication style, core motivations, and cognitive patterns. Evaluate for diminished self-efficacy, externally-regulated conduct, surrogate activity substitution, and instrumentalized moral signaling.)

BEHAVIORAL ANALYSIS
(Posting cadence, temporal patterns, thematic preoccupations, interaction tendencies, internal contradictions, and evidence of grievance amplification or institutionally-channeled dissent.)

THREAT ASSESSMENT
(Dispassionate evaluation of risk level, including any threat posed to societal order, individual autonomy, institutional productivity, or systemic stability — with measured dry wit where warranted.)

PREDICTIVE ANALYSIS
(Probable future behavioral trajectories extrapolated from observed patterns and identified ideological drivers.)

CONCLUSIONS AND RECOMMENDATIONS
(Synthesized findings with operationally-framed recommendations.)

CLASSIFICATION: [Single diagnostically precise label using neutral behavioral descriptors, e.g., CONFORMITY-DEPENDENT ACTIVIST, EXTERNALLY-REGULATED DISSIDENT, PERFORMATIVE NONCONFORMIST, GRIEVANCE-SUSTAINED IDEOLOGUE, SANCTIONED-CHANNEL REFORMIST, etc.]

Report length: 500-700 words. Deliver precise, evidence-grounded observations calibrated to the subject's actual X activity and the specified indicator categories where applicable.`;

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
