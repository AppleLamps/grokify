import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/proxy-image/route';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function proxyRequest(url?: string): NextRequest {
  const requestUrl = url
    ? `http://localhost/api/proxy-image?url=${encodeURIComponent(url)}`
    : 'http://localhost/api/proxy-image';
  return new NextRequest(requestUrl);
}

test('GET /api/proxy-image requires a URL', async () => {
  const response = await GET(proxyRequest());
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'URL parameter required');
});

test('GET /api/proxy-image rejects non-http protocols before fetch', async () => {
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    return new Response();
  };

  const response = await GET(proxyRequest('file:///etc/passwd'));

  assert.equal(response.status, 400);
  assert.equal(fetchCalled, false);
});

test('GET /api/proxy-image rejects loopback hosts before fetch', async () => {
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    return new Response();
  };

  const response = await GET(proxyRequest('http://127.0.0.1/image.png'));

  assert.equal(response.status, 400);
  assert.equal(fetchCalled, false);
});

test('GET /api/proxy-image rejects non-image responses', async () => {
  global.fetch = async () => new Response('not an image', {
    headers: { 'Content-Type': 'text/plain' },
  });

  const response = await GET(proxyRequest('https://93.184.216.34/file.txt'));

  assert.equal(response.status, 400);
});

test('GET /api/proxy-image rejects oversized images by content length', async () => {
  global.fetch = async () => new Response(new Uint8Array([1, 2, 3]), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(10 * 1024 * 1024 + 1),
    },
  });

  const response = await GET(proxyRequest('https://93.184.216.34/image.png'));

  assert.equal(response.status, 400);
});

test('GET /api/proxy-image passes through valid public images', async () => {
  global.fetch = async (input) => {
    assert.equal(String(input), 'https://93.184.216.34/image.png');
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { 'Content-Type': 'image/png' },
    });
  };

  const response = await GET(proxyRequest('https://93.184.216.34/image.png'));
  const body = new Uint8Array(await response.arrayBuffer());

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/png');
  assert.deepEqual([...body], [137, 80, 78, 71]);
});
