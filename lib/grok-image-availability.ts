export const GROK_IMAGE_GENERATION_ENABLED = false;
export const GROK_VIDEO_GENERATION_ENABLED = false;

export const GROK_IMAGE_TEMPORARILY_UNAVAILABLE_MESSAGE =
  'Grok image generation is temporarily unavailable. Please try again later.';
export const GROK_VIDEO_TEMPORARILY_UNAVAILABLE_MESSAGE =
  'Grok video generation is temporarily unavailable. Please try again later.';

export function isGrokImageGenerationEnabled(): boolean {
  return GROK_IMAGE_GENERATION_ENABLED;
}

export function isGrokVideoGenerationEnabled(): boolean {
  return GROK_VIDEO_GENERATION_ENABLED;
}

export function getHomePhotoUnavailableMessage(): string {
  return 'Grok Imagine image generation is temporarily unavailable. Please use Nano Banana Pro for photos.';
}

export function getImagineImageUnavailableMessage(): string {
  return 'Grok Imagine image generation is temporarily unavailable.';
}

export function getHomeVideoUnavailableMessage(): string {
  return 'Grok Imagine video generation is temporarily unavailable on the main page.';
}

export function getImagineVideoUnavailableMessage(): string {
  return 'Grok Imagine video generation is temporarily unavailable.';
}
