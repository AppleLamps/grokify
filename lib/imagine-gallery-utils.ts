import type { StoredImage } from '@/lib/imagine-storage';

export function buildStoredGalleryImage(
  image: StoredImage,
  thumbnailUrl?: string,
): StoredImage & { thumbnailUrl?: string } {
  if (image.type === 'video') {
    return { ...image };
  }

  return {
    ...image,
    thumbnailUrl,
  };
}
