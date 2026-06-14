/**
 * Shared prompt config used by both client and server modules.
 */

export const PROMPT_CONFIG = {
  /** Maximum character length for the main idea/concept input */
  IDEA_MAX_LENGTH: 1000,
  /** Maximum character length for the directions/modifiers input */
  DIRECTIONS_MAX_LENGTH: 500,
  /** Maximum file size for image uploads (in bytes) - 10MB */
  IMAGE_MAX_SIZE: 10 * 1024 * 1024,
  /** Target size for image compression (in bytes) - 1.5MB */
  IMAGE_TARGET_SIZE: 1.5 * 1024 * 1024,
  /** Maximum dimension for compressed images (in pixels) */
  IMAGE_MAX_DIMENSION: 2000,
} as const;

export const LIGHTING_MODES = [
  'AUTO',
  'GOLDEN_HOUR',
  'STUDIO',
  'NOIR',
  'NEON',
  'OVERCAST',
  'VOLUMETRIC',
] as const;

export type LightingMode = typeof LIGHTING_MODES[number];

export const IMAGE_INTENTS = [
  'RECREATE_CLOSELY',
] as const;

export type ImageIntent = typeof IMAGE_INTENTS[number];

// Prompt modifier presets for the standalone Grokify Prompt UI.
// These are multi-select text modifiers, not artwork style IDs.
export const PROMPT_STYLE_PRESETS: Record<string, string> = {
  Realistic: 'photorealistic rendering with natural lighting, high detail, and lifelike textures',
  Cartoon: 'vibrant cartoon style with bold colors, simplified forms, and playful character design',
  Anime: 'anime art style with expressive characters, dynamic poses, and detailed backgrounds',
  'Oil Painting': 'traditional oil painting technique with rich textures, visible brushstrokes, and classical composition',
  Cyberpunk: 'cyberpunk aesthetic with neon lighting, dark urban atmosphere, futuristic technology, and dystopian elements',
  Fantasy: 'fantasy art style with magical elements, ethereal lighting, mystical creatures, and enchanted environments',
  Steampunk: 'steampunk design with brass machinery, Victorian elements, steam-powered technology, and industrial aesthetics',
  'Sci-Fi': 'science fiction style with advanced technology, sleek designs, futuristic architecture, and space-age elements',
  Cinematic: 'cinematic composition with dramatic lighting, film-like quality, and professional cinematography',
  Dark: 'dark and moody atmosphere with deep shadows, muted colors, and mysterious ambiance',
  Ethereal: 'ethereal and dreamlike quality with soft lighting, flowing elements, and otherworldly beauty',
  Vintage: 'vintage aesthetic with retro colors, classic styling, and nostalgic atmosphere',
  Watercolor: 'watercolor painting style with soft washes, flowing pigments, delicate transparency, and organic color bleeding',
  Minimalist: 'minimalist design with clean lines, simple forms, negative space, and refined elegance',
  Abstract: 'abstract art style with non-representational forms, bold geometric shapes, and expressive color relationships',
  Surreal: 'surrealist aesthetic with dreamlike imagery, impossible scenarios, and fantastical visual metaphors',
  Gothic: 'gothic atmosphere with dramatic architecture, ornate details, mysterious shadows, and romantic darkness',
  Retro: 'retro design with mid-century modern elements, bold patterns, vintage typography, and nostalgic color palettes',
  Impressionist: 'impressionist painting style with loose brushwork, light effects, vibrant colors, and atmospheric quality',
  Documentary: 'documentary photography style with authentic moments, natural lighting, and journalistic storytelling approach',
};

export interface PromptTextPayload {
  prompt: string;
}

export interface JsonPromptSubject {
  description: string;
  position: string;
  action: string;
  color_palette: string[];
}

export interface JsonPromptCamera {
  angle: string;
  lens: string;
  'f-number': string;
  ISO: number;
  depth_of_field: string;
}

export interface JsonPromptPayload {
  scene: string;
  subjects: JsonPromptSubject[];
  style: string;
  color_palette: string[];
  lighting: string;
  mood: string;
  background: string;
  composition: string;
  camera: JsonPromptCamera;
}

export type StructuredPayload = PromptTextPayload | JsonPromptPayload;
