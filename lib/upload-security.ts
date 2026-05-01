import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, usageTracking } from '@/db';

export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const VIDEO_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

export const IMAGE_UPLOAD_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

export const VIDEO_UPLOAD_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]);

const MIME_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
};

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const memoryLimits = new Map<string, { count: number; resetAt: number }>();

export interface ParsedDataUrl {
  mimeType: string;
  extension: string;
  buffer: Buffer;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: Date;
}

function base64DecodedLength(base64: string): number {
  const normalized = base64.replace(/\s/g, '');
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

export function parseUploadDataUrl(
  dataUrl: string,
  allowedMimeTypes: Set<string>,
  maxBytes: number,
): ParsedDataUrl {
  const match = /^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]+)$/u.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid data URL format');
  }

  const mimeType = match[1].toLowerCase();
  if (!allowedMimeTypes.has(mimeType)) {
    throw new Error('Unsupported file type');
  }

  const base64Data = match[2];
  const approximateBytes = base64DecodedLength(base64Data);
  if (approximateBytes > maxBytes) {
    throw new Error('File too large');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > maxBytes) {
    throw new Error('File too large');
  }

  return {
    mimeType,
    extension: MIME_EXTENSION[mimeType] ?? mimeType.split('/')[1],
    buffer,
  };
}

export async function getAnonymousIdentifier(req: NextRequest): Promise<string> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const data = new TextEncoder().encode(`${ip}:${userAgent}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function memoryConsume(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const existing = memoryLimits.get(key);
  const state = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
    : existing;

  if (state.count >= limit) {
    memoryLimits.set(key, state);
    return {
      limited: true,
      remaining: 0,
      resetAt: new Date(state.resetAt),
    };
  }

  state.count += 1;
  memoryLimits.set(key, state);
  return {
    limited: false,
    remaining: Math.max(0, limit - state.count),
    resetAt: new Date(state.resetAt),
  };
}

export async function consumeAnonymousRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
): Promise<RateLimitResult> {
  const anonymousId = await getAnonymousIdentifier(req);
  const key = `${scope}:${anonymousId}`;

  if (limit <= 0) {
    return {
      limited: true,
      remaining: 0,
      resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW_MS),
    };
  }

  if (!process.env.DATABASE_URL) {
    return memoryConsume(key, limit);
  }

  const db = getDb();
  const now = new Date();
  const existingRows = await db
    .select()
    .from(usageTracking)
    .where(eq(usageTracking.userIdentifier, key))
    .limit(1);

  const existing = existingRows[0];
  const lastResetAt = existing?.lastResetAt ? new Date(existing.lastResetAt) : null;
  const resetNeeded = !existing || !lastResetAt || now.getTime() - lastResetAt.getTime() >= RATE_LIMIT_WINDOW_MS;
  const currentCount = resetNeeded ? 0 : existing.premiumImagesCount ?? 0;
  const resetAt = resetNeeded || !lastResetAt
    ? new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)
    : new Date(lastResetAt.getTime() + RATE_LIMIT_WINDOW_MS);

  if (!existing) {
    await db.insert(usageTracking).values({
      userIdentifier: key,
      premiumImagesCount: 1,
      lastResetAt: now,
      updatedAt: now,
    });
    return { limited: limit <= 0, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (currentCount >= limit) {
    return { limited: true, remaining: 0, resetAt };
  }

  await db
    .update(usageTracking)
    .set({
      premiumImagesCount: currentCount + 1,
      lastResetAt: resetNeeded ? now : existing.lastResetAt,
      updatedAt: now,
    })
    .where(eq(usageTracking.userIdentifier, key));

  return {
    limited: false,
    remaining: Math.max(0, limit - currentCount - 1),
    resetAt,
  };
}

export function getRateLimit(limitEnvName: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[limitEnvName] ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function resetInMemoryRateLimitsForTests(): void {
  memoryLimits.clear();
}
