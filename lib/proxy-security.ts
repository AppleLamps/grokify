import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const MAX_PROXY_BYTES = 10 * 1024 * 1024;

function ipv4ToNumber(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, part) => (acc << 8) + Number.parseInt(part, 10), 0) >>> 0;
}

function ipv4InRange(ip: string, cidrBase: string, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4ToNumber(ip) & mask) === (ipv4ToNumber(cidrBase) & mask);
}

export function isBlockedIpAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    return [
      ['0.0.0.0', 8],
      ['10.0.0.0', 8],
      ['127.0.0.0', 8],
      ['169.254.0.0', 16],
      ['172.16.0.0', 12],
      ['192.168.0.0', 16],
      ['100.64.0.0', 10],
      ['224.0.0.0', 4],
    ].some(([base, prefix]) => ipv4InRange(address, String(base), Number(prefix)));
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    return normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:');
  }

  return true;
}

export async function validateProxyUrl(rawUrl: string | null): Promise<URL> {
  if (!rawUrl) {
    throw new Error('URL parameter required');
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Unsupported URL protocol');
  }

  if (url.username || url.password) {
    throw new Error('URL credentials are not allowed');
  }

  const directIpVersion = isIP(url.hostname);
  const addresses = directIpVersion
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true, verbatim: true });

  if (!addresses.length || addresses.some(({ address }) => isBlockedIpAddress(address))) {
    throw new Error('URL host is not allowed');
  }

  return url;
}

export async function readImageResponseWithLimit(response: Response): Promise<ArrayBuffer> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error('URL did not return an image');
  }

  const contentLength = Number.parseInt(response.headers.get('content-length') || '', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_PROXY_BYTES) {
    throw new Error('Image is too large');
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_PROXY_BYTES) {
    throw new Error('Image is too large');
  }

  return buffer;
}
