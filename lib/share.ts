/**
 * Share utilities for uploading images and opening X share intents
 */

interface UploadResult {
  success: boolean;
  imageId?: string;
  imageUrl?: string;
  shareUrl?: string;
  error?: string;
}

/**
 * Upload an image to blob storage and get the share URL
 */
export async function uploadImageForSharing(
  imageDataUrl: string,
  username?: string
): Promise<UploadResult> {
  try {
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl, username }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return {
      success: true,
      imageId: data.imageId,
      imageUrl: data.imageUrl,
      shareUrl: data.shareUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Open X (Twitter) share intent with the given text and URL
 */
export function openXShareIntent(text: string, url: string): void {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const intentUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

  window.open(intentUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
}

/**
 * Convert an image URL to a base64 data URL
 * Useful for converting blob URLs or external URLs to uploadable format
 * Uses a proxy for external URLs to avoid CORS issues
 */
export async function imageUrlToDataUrl(imageUrl: string): Promise<string> {
  // For external URLs (not blob: or data:), use the proxy to avoid CORS issues
  let fetchUrl = imageUrl;
  if (!imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
    fetchUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  }

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Full share flow: upload image and open X share intent
 */
export async function shareOnX(
  imageDataUrl: string,
  shareText: string,
  username?: string
): Promise<{ success: boolean; error?: string }> {
  // Upload the image
  const uploadResult = await uploadImageForSharing(imageDataUrl, username);

  if (!uploadResult.success || !uploadResult.shareUrl) {
    return { success: false, error: uploadResult.error || 'Upload failed' };
  }

  // Build the full share URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullShareUrl = `${baseUrl}${uploadResult.shareUrl}`;

  // Open the X share intent
  openXShareIntent(shareText, fullShareUrl);

  return { success: true };
}

/**
 * Get the default share text based on username
 */
export function getDefaultShareText(username?: string): string {
  if (username) {
    return `Check out my @${username} X profile artwork, created by Xpressionist! Funded by $GROKIFY 🎨`;
  }
  return 'Check out this AI-generated artwork from my X profile, created by Xpressionist! Funded by $GROKIFY 🎨';
}

