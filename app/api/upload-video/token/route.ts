import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { customAlphabet } from 'nanoid';
import { consumeAnonymousRateLimit, getRateLimit, VIDEO_UPLOAD_MAX_BYTES } from '@/lib/upload-security';
import { verifyVideoUploadIntent } from '@/lib/upload-intent';
import { serverLogger } from '@/lib/server-logger';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

export async function POST(req: NextRequest) {
    const body = await req.json() as HandleUploadBody;

    try {
        let verifiedIntent: Awaited<ReturnType<typeof verifyVideoUploadIntent>> | null = null;
        if (body.type === 'blob.generate-client-token') {
            const rateLimit = await consumeAnonymousRateLimit(
                req,
                'upload-video-token',
                getRateLimit('UPLOAD_VIDEO_TOKEN_DAILY_LIMIT', 20)
            );
            if (rateLimit.limited) {
                throw new Error('Too many uploads. Please try again later.');
            }
            verifiedIntent = await verifyVideoUploadIntent(req, body.payload.clientPayload);
        }

        const response = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async (_pathname, clientPayload) => {
                const intent = verifiedIntent ?? await verifyVideoUploadIntent(req, clientPayload);
                // Generate a unique video ID for the filename
                const videoId = nanoid();
                return {
                    allowedContentTypes: [intent.contentType],
                    maximumSizeInBytes: Math.min(intent.maxSize, VIDEO_UPLOAD_MAX_BYTES),
                    validUntil: intent.exp,
                    tokenPayload: JSON.stringify({
                        videoId,
                        contentType: intent.contentType,
                        size: intent.size,
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                serverLogger.info('Video upload completed', {
                    url: blob.url,
                    tokenPayload,
                });
            },
        });

        return NextResponse.json(response);
    } catch (error) {
        serverLogger.warn('Upload token rejected', { error });
        const message = error instanceof Error ? error.message : 'Failed to generate upload token';
        const status = message.includes('Too many uploads') ? 429 : 400;
        return NextResponse.json(
            { error: status === 429 ? message : 'Failed to generate upload token' },
            { status }
        );
    }
}
