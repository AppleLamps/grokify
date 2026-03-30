export interface NormalizedFactCheckXUrl {
  normalizedUrl: string;
  handle: string | null;
  postId: string | null;
}

const SUPPORTED_HOSTS = new Set([
  'x.com',
  'twitter.com',
  'www.x.com',
  'www.twitter.com',
  'mobile.x.com',
  'mobile.twitter.com',
]);

export function normalizeFactCheckXUrl(input: string): NormalizedFactCheckXUrl {
  const trimmed = input.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('Invalid X post URL');
  }

  const normalizedHost = url.hostname.toLowerCase();
  if (!SUPPORTED_HOSTS.has(normalizedHost)) {
    throw new Error('Invalid X post URL');
  }

  const pathSegments = url.pathname.split('/').filter(Boolean);

  if (pathSegments.length >= 4 && pathSegments[0] === 'i' && pathSegments[1] === 'web' && pathSegments[2] === 'status') {
    const postId = pathSegments[3];
    if (!/^\d+$/.test(postId)) {
      throw new Error('Invalid X post URL');
    }

    return {
      normalizedUrl: `https://x.com/i/web/status/${postId}`,
      handle: null,
      postId,
    };
  }

  if (pathSegments.length < 3) {
    throw new Error('Invalid X post URL');
  }

  const [handle, statusSegment, postId] = pathSegments;
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle) || statusSegment !== 'status' || !/^\d+$/.test(postId)) {
    throw new Error('Invalid X post URL');
  }

  return {
    normalizedUrl: `https://x.com/${handle}/status/${postId}`,
    handle,
    postId,
  };
}
