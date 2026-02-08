/**
 * Valid art style keys matching STYLE_PROMPTS in generate-image route
 */
export const VALID_STYLES = new Set([
  // Classic/Traditional
  'default', 'oil', 'watercolor', 'charcoal', 'renaissance', 'baroque', 'pencil', 'artdeco',
  // Anime/Eastern
  'ghibli', 'anime', 'manga', 'chibi', 'ukiyo', 'shonen', 'manhwa',
  // Modern/Digital
  'pixar', 'cyberpunk', 'vaporwave', 'lowpoly', 'neon', 'minimalist', 'glitch', 'synthwave', 'hyperreal',
  // Artistic
  'comic', 'retro', 'impressionist', 'surreal', 'warhol', 'noir', 'expressionist', 'psychedelic',
  // Fun/Novelty
  'sticker', 'claymation', 'graffiti', 'pixel', 'lego', 'papercut', 'balloon', 'plushie', 'vintage', 'steampunk', 'fantasy',
]);

/**
 * Human-readable style names for reply text
 */
export const STYLE_DISPLAY_NAMES: Record<string, string> = {
  default: 'MAD Magazine',
  oil: 'Oil Painting',
  watercolor: 'Watercolor',
  charcoal: 'Charcoal Sketch',
  renaissance: 'Renaissance',
  baroque: 'Baroque',
  pencil: 'Pencil Sketch',
  artdeco: 'Art Deco',
  ghibli: 'Studio Ghibli',
  anime: 'Anime',
  manga: 'Manga',
  chibi: 'Chibi',
  ukiyo: 'Ukiyo-e',
  shonen: 'Shonen',
  manhwa: 'Manhwa',
  pixar: 'Pixar 3D',
  cyberpunk: 'Cyberpunk',
  vaporwave: 'Vaporwave',
  lowpoly: 'Low Poly',
  neon: 'Neon Glow',
  minimalist: 'Minimalist',
  glitch: 'Glitch Art',
  synthwave: 'Synthwave',
  hyperreal: 'Hyperrealistic',
  comic: 'Comic Book',
  retro: 'Retro Pop',
  impressionist: 'Impressionist',
  surreal: 'Surrealist',
  warhol: 'Warhol Pop Art',
  noir: 'Film Noir',
  expressionist: 'Expressionist',
  psychedelic: 'Psychedelic',
  sticker: 'Sticker',
  claymation: 'Claymation',
  graffiti: 'Graffiti',
  pixel: 'Pixel Art',
  lego: 'LEGO',
  papercut: 'Paper Cut',
  balloon: 'Balloon Art',
  plushie: 'Plushie',
  vintage: 'Vintage Photo',
  steampunk: 'Steampunk',
  fantasy: 'Fantasy RPG',
};

/** Max mentions to process per author per hour */
export const AUTHOR_RATE_LIMIT = 3;

/** Time budget for cron execution (leave 50s buffer from 300s max) */
export const TIME_BUDGET_MS = 250_000;
