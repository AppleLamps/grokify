// Shared style prompt templates used by both /api/generate-image and /api/imagine
// Each key maps to a detailed prompt prefix describing the desired art style.

export const STYLE_PROMPTS: Record<string, string> = {
  // Classic/Traditional
  default: `Create a satirical cartoon illustration in the style of MAD Magazine with bold outlines, vibrant colors, and exaggerated expressions.`,

  oil: `Create a classical oil painting style illustration with rich textures, visible brushstrokes, dramatic chiaroscuro lighting, deep saturated colors, and the timeless elegance of Renaissance masters.`,

  watercolor: `Create a soft, dreamy watercolor painting illustration with flowing colors, gentle gradients, organic brush strokes, subtle color bleeding, and the delicate, artistic quality of traditional watercolor art.`,

  charcoal: `Create a dramatic charcoal sketch illustration with bold strokes, deep blacks, soft grays, smudged textures, expressive lines, and the raw artistic quality of traditional life drawing.`,

  renaissance: `Create a Renaissance portrait in the style of Leonardo da Vinci or Raphael, with sfumato technique, warm earth tones, classical composition, dramatic lighting, and timeless elegance.`,

  baroque: `Create a dramatic Baroque style painting with rich dark backgrounds, theatrical lighting, dynamic composition, ornate details, and the dramatic grandeur of Caravaggio or Rembrandt.`,

  pencil: `Create a detailed pencil sketch illustration with fine linework, crosshatching for shading, realistic proportions, subtle gradations, and the refined quality of classical figure drawing.`,

  artdeco: `Create an Art Deco style illustration with geometric patterns, bold lines, luxurious gold and black colors, symmetrical designs, and the glamorous 1920s aesthetic of the Jazz Age.`,

  // Anime/Eastern
  ghibli: `Create a beautiful illustration in the style of Studio Ghibli anime, with soft pastel colors, whimsical fantasy elements, dreamy atmosphere, gentle lighting, and the signature warm, nostalgic feeling of Hayao Miyazaki's films.`,

  anime: `Create a dynamic anime-style illustration with bold lines, expressive eyes, dramatic poses, vibrant colors, speed lines, and the energetic aesthetic of popular Japanese anime series.`,

  manga: `Create a black and white manga-style illustration with dramatic ink work, screentone shading, dynamic panel composition, expressive lines, and the distinctive aesthetic of Japanese comic art.`,

  chibi: `Create a super-cute chibi-style illustration with an oversized head, tiny body, huge sparkling eyes, rounded features, pastel colors, and the adorable kawaii aesthetic.`,

  ukiyo: `Create a Japanese ukiyo-e woodblock print style illustration with flat colors, bold outlines, wave patterns, traditional composition, limited color palette, and the elegant aesthetic of Hokusai.`,

  shonen: `Create an epic shonen manga style illustration with intense action poses, dramatic speed lines, powerful auras, dynamic angles, bold expressions, and the high-energy aesthetic of Dragon Ball or Naruto.`,

  manhwa: `Create a Korean manhwa (webtoon) style illustration with clean digital linework, soft color gradients, romantic lighting, beautiful character designs, and the polished aesthetic of popular Korean webtoons.`,

  // Modern/Digital
  pixar: `Create a 3D animated illustration in the style of Pixar movies, with expressive characters, vibrant saturated colors, smooth rendering, dynamic lighting, and that signature Pixar charm and warmth.`,

  cyberpunk: `Create a cyberpunk style illustration with neon lights, futuristic technology, dark urban atmosphere, holographic elements, rain-slicked streets, vibrant pink and cyan color palette, and dystopian sci-fi aesthetic.`,

  vaporwave: `Create a vaporwave aesthetic illustration with glitchy effects, Roman busts, gradient sunsets in pink and purple, palm trees, geometric shapes, 80s/90s nostalgia, and dreamy surreal atmosphere.`,

  lowpoly: `Create a low-poly 3D style illustration with geometric faceted surfaces, limited color palette, clean angular shapes, subtle gradients between polygons, and modern minimalist 3D aesthetic.`,

  neon: `Create a neon glow art illustration with bright luminous outlines, dark background, vibrant electric colors (pink, blue, purple), light bloom effects, and retro arcade aesthetic.`,

  minimalist: `Create a clean minimalist illustration with simple geometric shapes, limited color palette, lots of white space, flat design elements, and modern elegant simplicity.`,

  glitch: `Create a glitch art illustration with digital corruption effects, RGB channel splitting, pixel displacement, scan lines, data moshing aesthetic, and the chaotic beauty of broken digital media.`,

  synthwave: `Create a synthwave/retrowave style illustration with neon grids, chrome text effects, sunset gradients in pink and orange, palm tree silhouettes, sports cars, and 80s retro-futuristic aesthetic.`,

  hyperreal: `Create a hyperrealistic digital art illustration with ultra-detailed textures, photorealistic lighting, sharp focus, perfect skin details, and the polished quality of high-end digital concept art.`,

  // Artistic
  comic: `Create a bold comic book style illustration with thick black outlines, halftone dots, dynamic panel-like composition, dramatic shadows, action lines, and speech bubble-ready aesthetic like classic Marvel or DC comics.`,

  retro: `Create a retro pop art style illustration inspired by 80s and 90s aesthetics, with bold geometric shapes, neon colors, pixel art elements, synthwave vibes, VHS grain, and nostalgic vintage feel.`,

  impressionist: `Create an impressionist painting illustration in the style of Monet or Renoir, with visible brushstrokes, soft edges, dappled light, pastel colors, and the dreamy atmospheric quality of French impressionism.`,

  surreal: `Create a surrealist illustration in the style of Salvador Dalí, with dreamlike impossible imagery, melting objects, unexpected juxtapositions, symbolic elements, and the bizarre beauty of the subconscious mind.`,

  warhol: `Create a pop art illustration in the style of Andy Warhol, with bold flat colors, high contrast, repeated image variations, screen print texture, and the iconic aesthetic of 1960s pop art.`,

  noir: `Create a film noir style illustration with dramatic black and white contrast, venetian blind shadows, moody lighting, mysterious atmosphere, rain-soaked streets, and the cinematic aesthetic of 1940s detective movies.`,

  expressionist: `Create an expressionist illustration with bold distorted forms, emotional color choices, visible brushwork, exaggerated features, psychological intensity, and the raw emotional power of artists like Edvard Munch.`,

  psychedelic: `Create a psychedelic art illustration with swirling patterns, vibrant rainbow colors, flowing organic shapes, kaleidoscopic effects, trippy optical illusions, and the mind-expanding aesthetic of 1960s counterculture.`,

  // Fun/Novelty
  sticker: `Create a sticker art style illustration with bold outlines, flat vibrant colors, die-cut border effect, subtle drop shadow, and the playful aesthetic of vinyl stickers.`,

  claymation: `Create a claymation-style illustration that looks like stop-motion animation with clay figures, visible texture, soft lighting, rounded shapes, and the charming handmade quality of Wallace & Gromit.`,

  graffiti: `Create a street graffiti art illustration with bold spray paint style, dripping effects, bubble letters, urban textures, vibrant colors, and the raw energy of street art murals.`,

  pixel: `Create an 8-bit pixel art illustration with chunky pixels, limited retro color palette, nostalgic video game aesthetic, clean pixel-perfect edges, and the charming simplicity of classic arcade games.`,

  lego: `Create a LEGO brick style illustration with characters as LEGO minifigures, blocky proportions, plastic sheen, bright primary colors, and the playful toy aesthetic of LEGO sets.`,

  papercut: `Create a layered paper cut art illustration with visible paper layers, subtle shadows between layers, clean cut edges, limited color palette, and the handcrafted aesthetic of paper sculpture.`,

  balloon: `Create a balloon animal sculpture style illustration with twisted balloon shapes, shiny reflective surface, simple rounded forms, bright colors, and the playful aesthetic of balloon art.`,

  plushie: `Create a cute plushie/stuffed toy style illustration with soft fuzzy textures, button eyes, stitched details, huggable proportions, and the adorable aesthetic of handmade stuffed animals.`,

  vintage: `Create a vintage photograph style illustration with sepia tones, aged paper texture, Victorian-era clothing and styling, oval vignette frame, and the nostalgic aesthetic of 19th century photography.`,

  steampunk: `Create a steampunk style illustration with brass gears and cogs, Victorian fashion, goggles and top hats, steam-powered machinery, copper pipes, and the retro-futuristic aesthetic of alternate history.`,

  fantasy: `Create an epic fantasy RPG style illustration with heroic pose, magical effects, detailed armor or robes, dramatic lighting, and the epic aesthetic of Dungeons & Dragons character art.`,
};

// Get style prompt for a given style ID, falling back to 'default'
export const getStylePrompt = (style: string = 'default'): string => {
  return STYLE_PROMPTS[style] || STYLE_PROMPTS.default;
};

// Get all valid style IDs
export const getValidStyleIds = (): string[] => {
  return Object.keys(STYLE_PROMPTS);
};
