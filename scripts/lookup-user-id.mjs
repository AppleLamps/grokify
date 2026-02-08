import { config } from 'dotenv';
import crypto from 'crypto';

config({ path: '.env.local' });

const handle = process.env.X_BOT_HANDLE;
const consumerKey = process.env.X_API_KEY;
const consumerSecret = process.env.X_API_SECRET;
const accessToken = process.env.X_ACCESS_TOKEN;
const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

if (!handle || !consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
  console.log('Missing required env vars in .env.local');
  process.exit(1);
}

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/\*/g, '%2A')
    .replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function signRequest(method, url, params) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };
  const allParams = { ...params, ...oauthParams };
  const sorted = Object.keys(allParams).sort();
  const paramString = sorted.map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`).join('&');
  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join('&');
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  oauthParams.oauth_signature = signature;
  return 'OAuth ' + Object.keys(oauthParams).sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');
}

console.log(`Looking up @${handle}...`);

const baseUrl = `https://api.x.com/2/users/by/username/${handle}`;
const authHeader = signRequest('GET', baseUrl, {});

const res = await fetch(baseUrl, { headers: { Authorization: authHeader } });
const data = await res.json();

if (data.data) {
  console.log(`\nFound: @${data.data.username}`);
  console.log(`X_BOT_USER_ID=${data.data.id}`);
  console.log(`\nAdd this to your .env.local`);
} else {
  console.log('Response:', JSON.stringify(data, null, 2));
}
