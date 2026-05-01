import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';
import { getAnonymousIdentifier, VIDEO_UPLOAD_MAX_BYTES, VIDEO_UPLOAD_MIME_TYPES } from '@/lib/upload-security';

const INTENT_TTL_MS = 5 * 60 * 1000;

interface UploadIntentPayload {
  anonymousId: string;
  contentType: string;
  size: number;
  maxSize: number;
  exp: number;
  nonce: string;
}

function getSecret(): string {
  return process.env.UPLOAD_INTENT_SECRET || process.env.CRON_SECRET || 'local-upload-intent-secret';
}

function signPayload(encodedPayload: string): string {
  return createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');
}

export async function createVideoUploadIntent(
  req: NextRequest,
  contentType: string,
  size: number,
): Promise<string> {
  if (!VIDEO_UPLOAD_MIME_TYPES.has(contentType)) {
    throw new Error('Unsupported video type');
  }

  if (!Number.isFinite(size) || size <= 0 || size > VIDEO_UPLOAD_MAX_BYTES) {
    throw new Error('Video too large. Maximum size is 50MB.');
  }

  const payload: UploadIntentPayload = {
    anonymousId: await getAnonymousIdentifier(req),
    contentType,
    size,
    maxSize: VIDEO_UPLOAD_MAX_BYTES,
    exp: Date.now() + INTENT_TTL_MS,
    nonce: randomBytes(16).toString('base64url'),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export async function verifyVideoUploadIntent(
  req: NextRequest,
  token: string | null,
): Promise<UploadIntentPayload> {
  if (!token) {
    throw new Error('Missing upload intent');
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    throw new Error('Invalid upload intent');
  }

  const expected = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid upload intent');
  }

  let payload: UploadIntentPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as UploadIntentPayload;
  } catch {
    throw new Error('Invalid upload intent');
  }

  if (payload.exp < Date.now()) {
    throw new Error('Upload intent expired');
  }

  if (payload.anonymousId !== await getAnonymousIdentifier(req)) {
    throw new Error('Upload intent does not match request');
  }

  if (!VIDEO_UPLOAD_MIME_TYPES.has(payload.contentType) || payload.size > payload.maxSize || payload.maxSize > VIDEO_UPLOAD_MAX_BYTES) {
    throw new Error('Invalid upload intent constraints');
  }

  return payload;
}
