import crypto from 'crypto';

// ─── OAuth 1.0a Signing ───────────────────────────────────────────────

interface OAuthConfig {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

function getOAuthConfig(): OAuthConfig {
  const consumerKey = process.env.X_API_KEY;
  const consumerSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new Error('Missing X API OAuth credentials in environment variables');
  }

  return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function signRequest(
  method: string,
  url: string,
  params: Record<string, string>,
  config: OAuthConfig
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: '1.0',
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join('&');

  const signingKey = `${percentEncode(config.consumerSecret)}&${percentEncode(config.accessTokenSecret)}`;
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  oauthParams.oauth_signature = signature;

  return (
    'OAuth ' +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(', ')
  );
}

// ─── X API Types ──────────────────────────────────────────────────────

export interface XMention {
  id: string;
  text: string;
  authorId: string;
  authorHandle: string;
  mentionedUsernames: string[];
  photoUrl?: string;
}

interface XMentionsResponse {
  data?: Array<{
    id: string;
    text: string;
    author_id: string;
    entities?: {
      mentions?: Array<{ username: string }>;
    };
    attachments?: {
      media_keys?: string[];
    };
  }>;
  includes?: {
    users?: Array<{ id: string; username: string }>;
    media?: Array<{ media_key: string; type: string; url?: string; preview_image_url?: string }>;
  };
  meta?: {
    newest_id?: string;
    oldest_id?: string;
    result_count?: number;
  };
}

// ─── API Functions ────────────────────────────────────────────────────

/**
 * Fetch recent @mentions of the bot account from X API v2
 */
export async function fetchMentions(sinceId?: string): Promise<XMention[]> {
  const userId = process.env.X_BOT_USER_ID;
  if (!userId) throw new Error('X_BOT_USER_ID is not configured');

  const config = getOAuthConfig();
  const baseUrl = `https://api.x.com/2/users/${userId}/mentions`;

  const params: Record<string, string> = {
    'tweet.fields': 'author_id,created_at,entities,attachments',
    'user.fields': 'username',
    'media.fields': 'type,url,preview_image_url',
    expansions: 'author_id,attachments.media_keys',
    max_results: '20',
  };
  if (sinceId) params.since_id = sinceId;

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  // For GET requests, query params ARE included in the OAuth signature
  const authHeader = signRequest('GET', baseUrl, params, config);

  const response = await fetch(url.toString(), {
    headers: { Authorization: authHeader },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X API mentions error: ${response.status} ${errorText}`);
  }

  const data: XMentionsResponse = await response.json();

  if (!data.data || data.data.length === 0) {
    return [];
  }

  // Build a user ID → username map from includes
  const userMap = new Map<string, string>();
  if (data.includes?.users) {
    for (const user of data.includes.users) {
      userMap.set(user.id, user.username);
    }
  }

  // Build a media_key → photo URL map from includes
  const mediaMap = new Map<string, string>();
  if (data.includes?.media) {
    for (const media of data.includes.media) {
      if (media.type === 'photo' && (media.url || media.preview_image_url)) {
        mediaMap.set(media.media_key, media.url || media.preview_image_url!);
      }
    }
  }

  return data.data.map((tweet) => {
    // Find the first photo attachment URL
    let photoUrl: string | undefined;
    if (tweet.attachments?.media_keys) {
      for (const key of tweet.attachments.media_keys) {
        const url = mediaMap.get(key);
        if (url) {
          photoUrl = url;
          break;
        }
      }
    }

    return {
      id: tweet.id,
      text: tweet.text,
      authorId: tweet.author_id,
      authorHandle: userMap.get(tweet.author_id) || 'unknown',
      mentionedUsernames:
        tweet.entities?.mentions?.map((m) => m.username) || [],
      photoUrl,
    };
  });
}

/**
 * Upload an image to X via v1.1 media upload (base64 simple upload)
 * For images under 5MB which covers all generated images.
 */
export async function uploadMedia(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const config = getOAuthConfig();
  const url = 'https://upload.twitter.com/1.1/media/upload.json';

  // For multipart uploads, body params are NOT included in the OAuth signature
  const authHeader = signRequest('POST', url, {}, config);

  const formData = new FormData();
  formData.append('media_data', imageBuffer.toString('base64'));
  formData.append('media_category', 'tweet_image');

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X media upload error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.media_id_string;
}

/**
 * Post a reply tweet with media via X API v2
 */
export async function postReply(
  replyToTweetId: string,
  text: string,
  mediaId: string
): Promise<string> {
  const config = getOAuthConfig();
  const url = 'https://api.x.com/2/tweets';

  // For JSON body POST requests, body params are NOT included in the OAuth signature
  const authHeader = signRequest('POST', url, {}, config);

  const body = {
    text,
    reply: { in_reply_to_tweet_id: replyToTweetId },
    media: { media_ids: [mediaId] },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X tweet creation error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data.id;
}

/**
 * Post a text-only reply (used for help messages or error fallbacks)
 */
export async function postTextReply(
  replyToTweetId: string,
  text: string
): Promise<string> {
  const config = getOAuthConfig();
  const url = 'https://api.x.com/2/tweets';

  const authHeader = signRequest('POST', url, {}, config);

  const body = {
    text,
    reply: { in_reply_to_tweet_id: replyToTweetId },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X text reply error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data.id;
}
