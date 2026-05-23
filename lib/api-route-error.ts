import { NextResponse } from 'next/server';

export const API_ERROR_MESSAGES = {
  AI_UNAVAILABLE: 'The AI service is currently unavailable. Please try again later.',
  UNEXPECTED: 'An unexpected error occurred. Please try again later.',
  TIMEOUT: 'The request timed out. Please try again later.',
  IMAGE_GENERATION_FAILED: 'Failed to generate image. Please try again later.',
  VIDEO_GENERATION_FAILED: 'Failed to generate video. Please try again later.',
} as const;

export function isRequestTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Request timed out after');
}

export function apiErrorResponse(
  message: string,
  status: number,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ error: message }, { status, headers });
}

export function unexpectedErrorResponse(headers?: Record<string, string>): NextResponse {
  return apiErrorResponse(API_ERROR_MESSAGES.UNEXPECTED, 500, headers);
}

export function aiUnavailableResponse(headers?: Record<string, string>): NextResponse {
  return apiErrorResponse(API_ERROR_MESSAGES.AI_UNAVAILABLE, 502, headers);
}

export function routeErrorResponse(
  error: unknown,
  headers?: Record<string, string>,
): NextResponse {
  if (isRequestTimeoutError(error)) {
    return apiErrorResponse(API_ERROR_MESSAGES.TIMEOUT, 504, headers);
  }

  return unexpectedErrorResponse(headers);
}

export async function logUpstreamFailure(
  log: (message: string, meta?: Record<string, unknown>) => void,
  message: string,
  response: Response,
): Promise<void> {
  const errorText = await response.text();
  log(message, {
    status: response.status,
    upstreamBytes: errorText.length,
  });
}
