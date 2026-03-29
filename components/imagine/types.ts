// Shared types for Grok Imagine components

export type GenerationType = 'image' | 'video';
export type ImageAspectRatio =
    | '1:1'
    | '16:9'
    | '9:16'
    | '4:3'
    | '3:4'
    | '3:2'
    | '2:3'
    | '2:1'
    | '1:2'
    | '19.5:9'
    | '9:19.5'
    | '20:9'
    | '9:20'
    | 'auto';
export type VideoAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';
export type AspectRatio = ImageAspectRatio | VideoAspectRatio;
export type VideoResolution = '480p' | '720p';
export type VideoSize = '848x480' | '1696x960' | '1280x720' | '1920x1080';

export interface GalleryImage {
    id: string;
    prompt: string;
    createdAt: number;
    aspectRatio: string;
    folderId: string | null;
    type: 'image' | 'video';
    thumbnailUrl?: string;
    url?: string; // For video URLs
}

export interface Folder {
    id: string;
    name: string;
    createdAt: number;
    order: number;
}

export interface GenerationSettings {
    prompt: string;
    type: GenerationType;
    aspectRatio: AspectRatio;
    imageCount: number;
    videoDuration: number;
    editImageBase64?: string | null;
    editVideoBase64?: string | null;
    referenceImageBase64s?: string[];
    videoResolution?: VideoResolution;
    videoSize?: VideoSize | null;
}

export interface VideoExtendSettings {
    prompt: string;
    duration: number;
    sourceVideoUrl?: string;
    sourceVideoBase64?: string | null;
    aspectRatio: string;
}

export const IMAGE_ASPECT_RATIOS: { value: ImageAspectRatio; label: string }[] = [
    { value: '1:1', label: '1:1 Square' },
    { value: '16:9', label: '16:9 Landscape' },
    { value: '9:16', label: '9:16 Portrait' },
    { value: '4:3', label: '4:3 Classic' },
    { value: '3:4', label: '3:4 Portrait' },
    { value: '3:2', label: '3:2 Photo' },
    { value: '2:3', label: '2:3 Portrait Photo' },
    { value: '2:1', label: '2:1 Banner' },
    { value: '1:2', label: '1:2 Tall Banner' },
    { value: '19.5:9', label: '19.5:9 Phone' },
    { value: '9:19.5', label: '9:19.5 Phone Portrait' },
    { value: '20:9', label: '20:9 Ultra-wide' },
    { value: '9:20', label: '9:20 Ultra-tall' },
    { value: 'auto', label: 'Auto' },
];

export const VIDEO_ASPECT_RATIOS: { value: VideoAspectRatio; label: string }[] = [
    { value: '16:9', label: '16:9 Landscape' },
    { value: '9:16', label: '9:16 Portrait' },
    { value: '1:1', label: '1:1 Square' },
    { value: '4:3', label: '4:3 Classic' },
    { value: '3:4', label: '3:4 Portrait' },
    { value: '3:2', label: '3:2 Photo' },
    { value: '2:3', label: '2:3 Portrait Photo' },
];

export const PROMPT_SUGGESTIONS = [
    'A mystical forest with glowing mushrooms and fireflies',
    'A futuristic cityscape with flying cars and neon signs',
    'A serene Japanese garden with cherry blossoms falling',
    'An astronaut riding a horse on Mars',
    'A cozy coffee shop on a rainy day',
    'A majestic dragon on a mountain peak at sunset',
];

export const VIDEO_RESOLUTIONS: { value: VideoResolution; label: string }[] = [
    { value: '480p', label: '480p' },
    { value: '720p', label: '720p' },
];

export const VIDEO_SIZES: { value: VideoSize; label: string }[] = [
    { value: '848x480', label: '848x480' },
    { value: '1280x720', label: '1280x720' },
    { value: '1696x960', label: '1696x960' },
    { value: '1920x1080', label: '1920x1080' },
];
