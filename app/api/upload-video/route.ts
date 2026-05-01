import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { customAlphabet } from 'nanoid';
import {
    consumeAnonymousRateLimit,
    getRateLimit,
    parseUploadDataUrl,
    VIDEO_UPLOAD_MAX_BYTES,
    VIDEO_UPLOAD_MIME_TYPES,
} from '@/lib/upload-security';
import { serverLogger } from '@/lib/server-logger';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
};

export async function POST(req: NextRequest) {
    try {
        const rateLimit = await consumeAnonymousRateLimit(
            req,
            'upload-video',
            getRateLimit('UPLOAD_VIDEO_DAILY_LIMIT', 10)
        );
        if (rateLimit.limited) {
            return NextResponse.json(
                { error: 'Too many uploads. Please try again later.' },
                { status: 429, headers: NO_STORE_HEADERS }
            );
        }

        const { videoDataUrl } = await req.json();

        if (!videoDataUrl) {
            return NextResponse.json(
                { error: 'No video data provided' },
                { status: 400, headers: NO_STORE_HEADERS }
            );
        }

        let parsed;
        try {
            parsed = parseUploadDataUrl(videoDataUrl, VIDEO_UPLOAD_MIME_TYPES, VIDEO_UPLOAD_MAX_BYTES);
        } catch (validationError) {
            return NextResponse.json(
                { error: validationError instanceof Error ? validationError.message : 'Invalid video data format' },
                { status: 400, headers: NO_STORE_HEADERS }
            );
        }

        // Generate unique ID for the video
        const videoId = nanoid();
        const filename = `grok-imagine-videos/${videoId}.${parsed.extension}`;

        // Upload to Vercel Blob
        const blob = await put(filename, parsed.buffer, {
            access: 'public',
            contentType: parsed.mimeType,
        });

        return NextResponse.json({
            success: true,
            videoId,
            videoUrl: blob.url,
        }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        serverLogger.error('Video upload error', { error });
        return NextResponse.json(
            { error: 'Failed to upload video' },
            { status: 500, headers: NO_STORE_HEADERS }
        );
    }
}
