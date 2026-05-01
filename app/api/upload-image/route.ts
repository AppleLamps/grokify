import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { customAlphabet } from 'nanoid';
import {
  consumeAnonymousRateLimit,
  getRateLimit,
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_MIME_TYPES,
  parseUploadDataUrl,
} from '@/lib/upload-security';
import { serverLogger } from '@/lib/server-logger';

// Use alphanumeric only (no underscores or dashes) to avoid filename parsing issues
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await consumeAnonymousRateLimit(
      req,
      'upload-image',
      getRateLimit('UPLOAD_IMAGE_DAILY_LIMIT', 20)
    );
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { status: 429, headers: NO_STORE_HEADERS }
      );
    }

    const { imageDataUrl, username } = await req.json();

    if (!imageDataUrl) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    let parsed;
    try {
      parsed = parseUploadDataUrl(imageDataUrl, IMAGE_UPLOAD_MIME_TYPES, IMAGE_UPLOAD_MAX_BYTES);
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : 'Invalid image data format' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Generate unique ID for the image (alphanumeric only)
    const imageId = nanoid();

    // Include username in filename for later retrieval
    // Use double underscore as separator since username won't have underscores after sanitization
    const usernameSlug = username ? `__${username.replace(/[^a-zA-Z0-9]/g, '')}` : '';
    const filename = `xpressionist/${imageId}${usernameSlug}.${parsed.extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, parsed.buffer, {
      access: 'public',
      contentType: parsed.mimeType,
    });

    return NextResponse.json({
      success: true,
      imageId,
      imageUrl: blob.url,
      shareUrl: `/share/${imageId}`,
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    serverLogger.error('Upload image error', { error });
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// GET endpoint to retrieve image by ID using Vercel Blob list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get('id');

  if (!imageId) {
    return NextResponse.json(
      { error: 'No image ID provided' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    // Search for blobs with this ID prefix
    const { blobs } = await list({
      prefix: `xpressionist/${imageId}`,
      limit: 1,
    });

    if (blobs.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const blob = blobs[0];

    // Extract username from filename if present (uses __ as separator)
    const filenameMatch = blob.pathname.match(/xpressionist\/[A-Za-z0-9]+__([^.]+)\./);
    const username = filenameMatch ? filenameMatch[1] : undefined;

    return NextResponse.json({
      imageId,
      url: blob.url,
      username,
      uploadedAt: blob.uploadedAt,
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    serverLogger.error('Get image error', { error });
    return NextResponse.json(
      { error: 'Failed to retrieve image' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
