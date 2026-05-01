import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { redactForLog } from '@/lib/server-logger';
import {
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_MIME_TYPES,
  parseUploadDataUrl,
  resetInMemoryRateLimitsForTests,
  consumeAnonymousRateLimit,
} from '@/lib/upload-security';

test('parseUploadDataUrl accepts allowlisted image data URLs', () => {
  const parsed = parseUploadDataUrl(
    `data:image/png;base64,${Buffer.from('png').toString('base64')}`,
    IMAGE_UPLOAD_MIME_TYPES,
    IMAGE_UPLOAD_MAX_BYTES,
  );

  assert.equal(parsed.mimeType, 'image/png');
  assert.equal(parsed.extension, 'png');
  assert.equal(parsed.buffer.toString(), 'png');
});

test('parseUploadDataUrl rejects unsupported image MIME types', () => {
  assert.throws(
    () => parseUploadDataUrl('data:image/svg+xml;base64,PHN2Zy8+', IMAGE_UPLOAD_MIME_TYPES, IMAGE_UPLOAD_MAX_BYTES),
    /Unsupported file type/,
  );
});

test('parseUploadDataUrl rejects oversized payloads before upload', () => {
  const oversizedBase64 = 'A'.repeat(Math.ceil((IMAGE_UPLOAD_MAX_BYTES + 1) / 3) * 4);

  assert.throws(
    () => parseUploadDataUrl(`data:image/png;base64,${oversizedBase64}`, IMAGE_UPLOAD_MIME_TYPES, IMAGE_UPLOAD_MAX_BYTES),
    /File too large/,
  );
});

test('consumeAnonymousRateLimit returns 429-ready state for zero limits', async () => {
  resetInMemoryRateLimitsForTests();
  const request = new NextRequest('http://localhost/api/upload-image', {
    headers: {
      'x-forwarded-for': '203.0.113.9',
      'user-agent': 'test-agent',
    },
  });

  const result = await consumeAnonymousRateLimit(request, 'test-zero-limit', 0);

  assert.equal(result.limited, true);
  assert.equal(result.remaining, 0);
});

test('redactForLog removes bearer tokens, data URLs, blob URLs, and prompt payloads', () => {
  const redacted = redactForLog({
    authorization: 'Bearer super-secret-token',
    preview: 'data:image/png;base64,abcdef',
    blob: 'https://example.public.blob.vercel-storage.com/file.png',
    prompt: 'paint a private scene',
    nested: { token: 'xai-secret' },
  });

  assert.deepEqual(redacted, {
    authorization: '[redacted]',
    preview: '[redacted-data-url]',
    blob: '[redacted-blob-url]',
    prompt: '[redacted]',
    nested: { token: '[redacted]' },
  });
});
