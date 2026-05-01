import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { readImageResponseWithLimit, validateProxyUrl } from '@/lib/proxy-security';
import { serverLogger } from '@/lib/server-logger';

const PROXY_TIMEOUT_MS = 15000;
const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
};

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter required' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    try {
        const validatedUrl = await validateProxyUrl(url);
        const response = await fetchWithTimeout(validatedUrl.toString(), {}, PROXY_TIMEOUT_MS);

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch image' },
                { status: 502, headers: NO_STORE_HEADERS }
            );
        }

        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = await readImageResponseWithLimit(response);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': 'attachment',
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    } catch (error) {
        serverLogger.warn('Proxy image request rejected', {
            reason: error instanceof Error ? error.message : 'Unknown proxy error',
        });
        return NextResponse.json(
            { error: 'Failed to proxy image' },
            { status: 400, headers: NO_STORE_HEADERS }
        );
    }
}
