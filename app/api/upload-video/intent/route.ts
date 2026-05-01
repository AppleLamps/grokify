import { NextRequest, NextResponse } from 'next/server';
import { createVideoUploadIntent } from '@/lib/upload-intent';
import { consumeAnonymousRateLimit, getRateLimit } from '@/lib/upload-security';
import { serverLogger } from '@/lib/server-logger';

const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
};

export async function POST(req: NextRequest) {
    try {
        const rateLimit = await consumeAnonymousRateLimit(
            req,
            'upload-video-intent',
            getRateLimit('UPLOAD_VIDEO_INTENT_DAILY_LIMIT', 20)
        );
        if (rateLimit.limited) {
            return NextResponse.json(
                { error: 'Too many uploads. Please try again later.' },
                { status: 429, headers: NO_STORE_HEADERS }
            );
        }

        const { contentType, size } = await req.json();
        const intent = await createVideoUploadIntent(req, String(contentType ?? ''), Number(size));

        return NextResponse.json({ intent }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        serverLogger.warn('Upload intent rejected', { error });
        return NextResponse.json(
            { error: 'Invalid upload request' },
            { status: 400, headers: NO_STORE_HEADERS }
        );
    }
}
