import { list } from '@vercel/blob';

/** Current Vercel Blob prefix for shareable artwork uploads. */
export const BLOB_ARTWORK_PREFIX = 'grokify';

/** Legacy prefix retained for backward-compatible lookups. */
export const LEGACY_BLOB_ARTWORK_PREFIX = 'xpressionist';

const BLOB_ARTWORK_PREFIXES = [BLOB_ARTWORK_PREFIX, LEGACY_BLOB_ARTWORK_PREFIX] as const;

const USERNAME_FROM_PATHNAME = /(?:grokify|xpressionist)\/[A-Za-z0-9]+__([^.]+)\./;

export function buildArtworkBlobPath(
  imageId: string,
  extension: string,
  username?: string,
): string {
  const usernameSlug = username ? `__${username.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  return `${BLOB_ARTWORK_PREFIX}/${imageId}${usernameSlug}.${extension}`;
}

export function extractUsernameFromArtworkPathname(pathname: string): string | undefined {
  const match = pathname.match(USERNAME_FROM_PATHNAME);
  return match?.[1];
}

export async function findArtworkBlob(imageId: string) {
  for (const prefix of BLOB_ARTWORK_PREFIXES) {
    const { blobs } = await list({
      prefix: `${prefix}/${imageId}`,
      limit: 1,
    });

    if (blobs.length > 0) {
      return blobs[0];
    }
  }

  return null;
}
