export interface CompressImageOptions {
  maxDimension: number;
  targetSizeBytes: number;
  createObjectUrl?: (file: File) => string;
  revokeObjectUrl?: (url: string) => void;
  loadImage?: (url: string) => Promise<{ width: number; height: number; image?: CanvasImageSource }>;
  renderToDataUrl?: (params: {
    image: CanvasImageSource;
    width: number;
    height: number;
    mimeType: string;
    quality: number;
  }) => Promise<string>;
}

export interface CompressedImageResult {
  base64: string;
  mimeType: string;
}

export const replacePreviewUrl = (
  previousUrl: string | null,
  nextUrl: string | null,
  revokeObjectUrl: (url: string) => void
): string | null => {
  if (previousUrl && previousUrl !== nextUrl) {
    revokeObjectUrl(previousUrl);
  }
  return nextUrl;
};

export const cleanupPreviewUrl = (
  previewUrl: string | null,
  revokeObjectUrl: (url: string) => void
) => {
  if (previewUrl) {
    revokeObjectUrl(previewUrl);
  }
};

const DEFAULT_QUALITY = 0.82;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.08;

const approximateBase64Bytes = (base64: string) => Math.ceil((base64.length * 3) / 4);

const parseDataUrl = (dataUrl: string): CompressedImageResult => {
  const match = /^data:(.+?);base64,(.+)$/u.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid image data URL');
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
};

const getOutputMimeType = (inputMimeType: string) => {
  if (inputMimeType === 'image/webp' || inputMimeType === 'image/jpeg') {
    return inputMimeType;
  }

  return 'image/jpeg';
};

const browserLoadImage = async (url: string) => {
  const image = new Image();
  image.decoding = 'async';

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image for compression.'));
    image.src = url;
  });

  return {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    image,
  };
};

const browserRenderToDataUrl = async ({
  image,
  width,
  height,
  mimeType,
  quality,
}: {
  image: CanvasImageSource;
  width: number;
  height: number;
  mimeType: string;
  quality: number;
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context is unavailable.');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL(mimeType, quality);
};

export const compressImageDataUrl = async (
  file: File,
  {
    maxDimension,
    targetSizeBytes,
    createObjectUrl = (input) => URL.createObjectURL(input),
    revokeObjectUrl = (url) => URL.revokeObjectURL(url),
    loadImage = browserLoadImage,
    renderToDataUrl = browserRenderToDataUrl,
  }: CompressImageOptions
): Promise<CompressedImageResult> => {
  const tempUrl = createObjectUrl(file);

  try {
    const loaded = await loadImage(tempUrl);
    const largestDimension = Math.max(loaded.width, loaded.height);
    const scale = largestDimension > maxDimension ? maxDimension / largestDimension : 1;
    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));
    const mimeType = getOutputMimeType(file.type || 'image/png');

    let quality = DEFAULT_QUALITY;
    let result = await renderToDataUrl({
      image: loaded.image ?? ({} as CanvasImageSource),
      width,
      height,
      mimeType,
      quality,
    });
    let parsed = parseDataUrl(result);

    while (
      parsed.mimeType !== 'image/png' &&
      approximateBase64Bytes(parsed.base64) > targetSizeBytes &&
      quality > MIN_QUALITY
    ) {
      quality = Math.max(MIN_QUALITY, Number((quality - QUALITY_STEP).toFixed(2)));
      result = await renderToDataUrl({
        image: loaded.image ?? ({} as CanvasImageSource),
        width,
        height,
        mimeType,
        quality,
      });
      parsed = parseDataUrl(result);
    }

    return parsed;
  } finally {
    revokeObjectUrl(tempUrl);
  }
};
