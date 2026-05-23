import { NextRequest, NextResponse } from 'next/server';
import { consumeAnonymousRateLimit, getRateLimit } from '@/lib/upload-security';

export type AiRateLimitScope =
  | 'analyze-account'
  | 'analyze-account-video'
  | 'roast-account'
  | 'fbi-profile'
  | 'osint-profile'
  | 'generate-image'
  | 'fact-check-x'
  | 'prompt-generate'
  | 'imagine'
  | 'imagine-video'
  | 'imagine-video-extend'
  | 'caricature'
  | 'joint-pic';

const AI_RATE_LIMIT_CONFIG: Record<
  AiRateLimitScope,
  { envVar: string; defaultLimit: number }
> = {
  'analyze-account': { envVar: 'AI_ANALYZE_ACCOUNT_DAILY_LIMIT', defaultLimit: 10 },
  'analyze-account-video': { envVar: 'AI_ANALYZE_ACCOUNT_VIDEO_DAILY_LIMIT', defaultLimit: 5 },
  'roast-account': { envVar: 'AI_ROAST_ACCOUNT_DAILY_LIMIT', defaultLimit: 10 },
  'fbi-profile': { envVar: 'AI_FBI_PROFILE_DAILY_LIMIT', defaultLimit: 5 },
  'osint-profile': { envVar: 'AI_OSINT_PROFILE_DAILY_LIMIT', defaultLimit: 5 },
  'generate-image': { envVar: 'AI_GENERATE_IMAGE_DAILY_LIMIT', defaultLimit: 5 },
  'fact-check-x': { envVar: 'AI_FACT_CHECK_DAILY_LIMIT', defaultLimit: 15 },
  'prompt-generate': { envVar: 'AI_PROMPT_GENERATE_DAILY_LIMIT', defaultLimit: 30 },
  imagine: { envVar: 'AI_IMAGINE_DAILY_LIMIT', defaultLimit: 5 },
  'imagine-video': { envVar: 'AI_IMAGINE_VIDEO_DAILY_LIMIT', defaultLimit: 3 },
  'imagine-video-extend': { envVar: 'AI_IMAGINE_VIDEO_EXTEND_DAILY_LIMIT', defaultLimit: 3 },
  caricature: { envVar: 'AI_CARICATURE_DAILY_LIMIT', defaultLimit: 5 },
  'joint-pic': { envVar: 'AI_JOINT_PIC_DAILY_LIMIT', defaultLimit: 10 },
};

export async function enforceAiRateLimit(
  req: NextRequest,
  scope: AiRateLimitScope,
  responseHeaders?: Record<string, string>,
): Promise<NextResponse | null> {
  const config = AI_RATE_LIMIT_CONFIG[scope];
  const result = await consumeAnonymousRateLimit(
    req,
    scope,
    getRateLimit(config.envVar, config.defaultLimit),
  );

  if (!result.limited) {
    return null;
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
  );

  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        ...responseHeaders,
        'Retry-After': String(retryAfterSeconds),
      },
    },
  );
}
