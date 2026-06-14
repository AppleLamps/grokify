export type ArtStyleCategory = 'classic' | 'anime' | 'modern' | 'artistic' | 'fun';

export type ArtStyle = {
  id: string;
  name: string;
  description: string;
  category: ArtStyleCategory;
};

export const ART_STYLES = [
  { id: 'default', name: 'MAD Magazine', description: 'Bold satirical cartoon style', category: 'classic' },
  { id: 'oil', name: 'Oil Painting', description: 'Classical oil painting style', category: 'classic' },
  { id: 'watercolor', name: 'Watercolor', description: 'Soft watercolor painting', category: 'classic' },
  { id: 'charcoal', name: 'Charcoal Sketch', description: 'Dramatic charcoal drawing', category: 'classic' },
  { id: 'renaissance', name: 'Renaissance', description: 'Classical Renaissance portrait', category: 'classic' },
  { id: 'baroque', name: 'Baroque', description: 'Ornate dramatic lighting', category: 'classic' },
  { id: 'pencil', name: 'Pencil Sketch', description: 'Detailed pencil drawing', category: 'classic' },
  { id: 'artdeco', name: 'Art Deco', description: '1920s geometric elegance', category: 'classic' },
  { id: 'ghibli', name: 'Studio Ghibli', description: 'Whimsical anime fantasy style', category: 'anime' },
  { id: 'anime', name: 'Anime', description: 'Japanese anime style', category: 'anime' },
  { id: 'manga', name: 'Manga B&W', description: 'Black & white manga panels', category: 'anime' },
  { id: 'chibi', name: 'Chibi', description: 'Cute super-deformed style', category: 'anime' },
  { id: 'ukiyo', name: 'Ukiyo-e', description: 'Japanese woodblock prints', category: 'anime' },
  { id: 'shonen', name: 'Shonen Action', description: 'Epic battle manga style', category: 'anime' },
  { id: 'manhwa', name: 'Manhwa', description: 'Korean webtoon style', category: 'anime' },
  { id: 'pixar', name: 'Pixar 3D', description: '3D animated movie style', category: 'modern' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon-lit futuristic style', category: 'modern' },
  { id: 'vaporwave', name: 'Vaporwave', description: '80s/90s aesthetic nostalgia', category: 'modern' },
  { id: 'lowpoly', name: 'Low Poly', description: 'Geometric 3D faceted style', category: 'modern' },
  { id: 'neon', name: 'Neon Glow', description: 'Glowing neon light art', category: 'modern' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean minimal illustration', category: 'modern' },
  { id: 'glitch', name: 'Glitch Art', description: 'Digital corruption aesthetic', category: 'modern' },
  { id: 'synthwave', name: 'Synthwave', description: 'Retro-futuristic 80s', category: 'modern' },
  { id: 'hyperreal', name: 'Hyperrealistic', description: 'Ultra-detailed photorealism', category: 'modern' },
  { id: 'mad-roast', name: 'MAD Roast', description: 'Chaotic MAD Magazine-style parody roast', category: 'artistic' },
  { id: 'comic', name: 'Comic Book', description: 'Bold comic book panels', category: 'artistic' },
  { id: 'retro', name: 'Retro Pop Art', description: '80s/90s pop art style', category: 'artistic' },
  { id: 'impressionist', name: 'Impressionist', description: 'Monet-style brushwork', category: 'artistic' },
  { id: 'surreal', name: 'Surrealism', description: 'Dreamlike Salvador Dali style', category: 'artistic' },
  { id: 'warhol', name: 'Warhol Pop', description: 'Andy Warhol screen print', category: 'artistic' },
  { id: 'noir', name: 'Film Noir', description: 'Moody black & white cinema', category: 'artistic' },
  { id: 'expressionist', name: 'Expressionist', description: 'Bold emotional distortion', category: 'artistic' },
  { id: 'psychedelic', name: 'Psychedelic', description: 'Trippy 60s colorful swirls', category: 'artistic' },
  { id: 'sticker', name: 'Sticker Art', description: 'Die-cut sticker aesthetic', category: 'fun' },
  { id: 'claymation', name: 'Claymation', description: 'Stop-motion clay style', category: 'fun' },
  { id: 'graffiti', name: 'Street Graffiti', description: 'Urban spray paint art', category: 'fun' },
  { id: 'pixel', name: 'Pixel Art', description: '8-bit retro game style', category: 'fun' },
  { id: 'lego', name: 'LEGO', description: 'Brick-built minifigure style', category: 'fun' },
  { id: 'papercut', name: 'Paper Cut', description: 'Layered paper craft art', category: 'fun' },
  { id: 'balloon', name: 'Balloon Animal', description: 'Twisted balloon sculpture', category: 'fun' },
  { id: 'plushie', name: 'Plushie', description: 'Cute stuffed toy style', category: 'fun' },
  { id: 'vintage', name: 'Vintage Photo', description: 'Old timey sepia portrait', category: 'fun' },
  { id: 'steampunk', name: 'Steampunk', description: 'Victorian brass & gears', category: 'fun' },
  { id: 'fantasy', name: 'Fantasy RPG', description: 'Epic D&D character art', category: 'fun' },
] as const satisfies readonly ArtStyle[];

export type ArtStyleId = typeof ART_STYLES[number]['id'];

export const ART_STYLE_IDS = ART_STYLES.map((style) => style.id);
