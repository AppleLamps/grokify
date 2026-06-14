// Shared style prompt templates used by both /api/generate-image and /api/imagine.
// Each style acts as a visual treatment layer on top of the account-derived scene prompt.

export const STYLE_PROMPTS: Record<string, string> = {
  // Classic / Traditional
  default:
    'Render the scene as a satirical editorial cartoon with bold black outlines, exaggerated facial features, punchy character acting, bright print-style color blocking, dense comedic background details, and lively MAD Magazine energy.',

  oil:
    'Render the scene as a classical oil painting with layered brush texture, rich pigment, warm museum-grade color depth, dramatic chiaroscuro lighting, carefully staged composition, and painterly surface detail throughout.',

  watercolor:
    'Render the scene as a refined watercolor illustration with soft pigment blooms, translucent layered washes, delicate edge variation, airy highlights, hand-painted paper texture, and gentle atmospheric transitions.',

  charcoal:
    'Render the scene as a dramatic charcoal drawing with smoky tonal gradients, heavy shadow masses, rough expressive mark-making, dusty paper texture, sharp silhouette contrast, and raw hand-drawn energy.',

  renaissance:
    'Render the scene with Renaissance portrait discipline using balanced composition, sculpted forms, warm earth pigments, soft sfumato transitions, dignified staging, and luminous classical skin and fabric treatment.',

  baroque:
    'Render the scene with Baroque intensity using theatrical spotlighting, deep shadow pools, ornate visual richness, dynamic diagonals, dark luxurious backgrounds, and dramatic high-contrast depth.',

  pencil:
    'Render the scene as a meticulous pencil illustration with crisp line hierarchy, controlled crosshatching, subtle graphite shading, realistic volume, clean draftsmanship, and refined sketchbook texture.',

  artdeco:
    'Render the scene in an Art Deco treatment with sleek geometric framing, elegant symmetry, polished metallic accents, stylized luxury surfaces, disciplined composition, and glamorous black-gold contrast.',

  // Anime / Eastern
  ghibli:
    'Render the scene with warm storybook animation styling, soft hand-painted color, inviting natural light, whimsical environmental detail, gentle emotional expressions, and cozy cinematic fantasy atmosphere.',

  anime:
    'Render the scene as polished anime key art with clean linework, vivid cel-shaded color, expressive faces, energetic posing, crisp separation of foreground and background, and heightened visual drama.',

  manga:
    'Render the scene as black-and-white manga art with bold ink contrast, speed-driven line energy, screentone shading, graphic panel-like framing, expressive facial exaggeration, and high-impact monochrome storytelling.',

  chibi:
    'Render the scene in chibi form with oversized heads, tiny bodies, rounded silhouettes, playful expressions, simplified props, pastel-bright color, and irresistibly cute visual exaggeration.',

  ukiyo:
    'Render the scene as a Japanese woodblock print with flat layered color, elegant contour lines, restrained palette, patterned negative space, decorative rhythm, and stylized traditional print texture.',

  shonen:
    'Render the scene with explosive shonen action language using extreme poses, charged motion lines, high-energy perspective, intense facial expression, saturated contrast, and heroic manga spectacle.',

  manhwa:
    'Render the scene as modern manhwa artwork with sleek digital linework, glossy color gradients, polished character rendering, romantic cinematic lighting, vertical-composition clarity, and clean premium finish.',

  // Modern / Digital
  pixar:
    'Render the scene as high-end stylized 3D animation with rounded appealing forms, expressive eyes, soft global illumination, vibrant but controlled color, polished materials, and cinematic family-film warmth.',

  cyberpunk:
    'Render the scene as dense cyberpunk illustration with neon magenta-cyan lighting, wet reflective surfaces, layered holographic signage, hard rim light, deep urban perspective, and sleek high-tech texture.',

  vaporwave:
    'Render the scene with vaporwave atmosphere using dreamy gradients, retro digital haze, pastel neon color, surreal spatial emptiness, nostalgic faux-80s iconography, and smooth synthetic glow.',

  lowpoly:
    'Render the scene as low-poly 3D art with faceted geometry, simplified planar shading, sharp silhouette edges, restrained polygonal detail, clean color grouping, and crisp modern digital composition.',

  neon:
    'Render the scene as luminous neon artwork with dark negative space, glowing contour edges, intense bloom, electric color contrast, signage-like highlights, and graphic nightlife atmosphere.',

  minimalist:
    'Render the scene in a minimalist illustration style with distilled shapes, controlled negative space, restrained palette, clean composition, simplified forms, and elegant visual reduction without clutter.',

  glitch:
    'Render the scene with glitch-art treatment using RGB separation, scanline distortion, digital tearing, corrupted pixel fragments, unstable light streaks, and deliberately broken-screen visual tension.',

  synthwave:
    'Render the scene with synthwave styling using sunset gradients, chrome-lit edges, retro-futurist magenta-orange-cyan palette, cinematic haze, stylized night atmosphere, and glossy 80s poster energy.',

  hyperreal:
    'Render the scene with hyperreal digital realism using razor-sharp detail, precise material definition, lifelike lighting response, cinematic depth, refined skin and surface texture, and premium concept-art fidelity.',

  // Artistic
  comic:
    'Render the scene as premium comic-book art with thick contour lines, halftone shadow language, bold action framing, saturated heroic color, graphic punch, and print-ready panel intensity.',

  retro:
    'Render the scene in retro pop illustration style with bold shape language, nostalgic color blocking, analog print texture, playful graphic rhythm, vintage commercial-art charm, and upbeat visual punch.',

  impressionist:
    'Render the scene as Impressionist painting with broken color strokes, luminous atmosphere, softened edges, light-driven form, airy palette shifts, and painterly movement over fine detail.',

  surreal:
    'Render the scene with surrealist logic using dreamlike spatial distortion, uncanny object relationships, symbolic staging, soft but eerie lighting, precise strange detail, and a lucid-unreal atmosphere.',

  warhol:
    'Render the scene as pop-art screen print with flat high-contrast color fields, repeated graphic shapes, posterized value structure, commercial print texture, bold iconic simplification, and gallery-wall punch.',

  noir:
    'Render the scene in film noir style with hard black-and-white contrast, smoky atmosphere, sharp shadow slashes, moody backlight, rain-slick reflections, and tense mid-century cinematic framing.',

  expressionist:
    'Render the scene with expressionist intensity using distorted forms, emotionally charged color, aggressive brush movement, psychological lighting, unstable perspective, and heightened inner-tension atmosphere.',

  psychedelic:
    'Render the scene as psychedelic art with swirling forms, vibrating rainbow contrast, hallucinatory pattern density, fluid transitions, optical distortion, and euphoric mind-bending visual rhythm.',

  // Roast / Parody
  'mad-roast':
    'Render the scene as a chaotic MAD Magazine-style satirical roast spread: grossly exaggerated central caricature embodying the subject\'s public archetype, crowded parody-poster layout, absurd thematic props, explosive dense background gags, satirical speech bubbles and labels, fake magazine-splash-cover energy, political cartoon composition, thick comic-book ink lines, halftone dot shading, vivid color contrast, and savage editorial-cartoon visual humor that frames the figure as a lovingly lampooned internet archetype.',

  // Fun / Novelty
  sticker:
    'Render the scene as sticker art with bold simplified shapes, clean die-cut silhouette, thick outlines, cheerful flat color, glossy decal finish, and playful merch-ready readability.',

  claymation:
    'Render the scene as claymation with squishy sculpted forms, tactile clay texture, soft studio lighting, rounded handmade imperfections, stop-motion charm, and cozy practical miniature depth.',

  graffiti:
    'Render the scene as street graffiti with aerosol texture, bold mural composition, drips and paint bloom, saturated urban color, expressive tagging energy, and rough wall-surface realism.',

  pixel:
    'Render the scene as high-quality pixel art with deliberate sprite-like shapes, limited retro palette, crisp pixel edges, readable silhouette design, tileable detail logic, and classic game-screen clarity.',

  lego:
    'Render the scene as LEGO-style construction with brick-built forms, minifigure proportions, glossy molded plastic surfaces, toy-like color blocking, modular geometry, and playful set-piece staging.',

  papercut:
    'Render the scene as layered paper-cut artwork with stacked silhouette planes, crisp cut edges, soft cast shadows between layers, handcrafted composition, and tactile collage depth.',

  balloon:
    'Render the scene as balloon-sculpture art with inflated tubular forms, glossy stretched highlights, playful curvature, bright carnival color, whimsical proportions, and reflective latex texture.',

  plushie:
    'Render the scene as plush toy illustration with soft stuffed volume, fuzzy textile texture, stitched details, rounded cuddly shapes, cozy lighting, and handmade collectible charm.',

  vintage:
    'Render the scene as antique photography with sepia toning, faded print texture, soft focus, age-worn contrast, period styling, and elegant archival portrait atmosphere.',

  steampunk:
    'Render the scene with steampunk treatment using brass machinery, riveted metal detail, Victorian industrial styling, warm copper light, smoky atmosphere, and elaborate retro-mechanical ornament.',

  fantasy:
    'Render the scene as epic fantasy illustration with heroic staging, magical light effects, ornate costume detail, storybook scale, atmospheric depth, and polished tabletop-RPG adventure energy.',
};

// Get style prompt for a given style ID, falling back to 'default'
export const getStylePrompt = (style: string = 'default'): string => {
  return STYLE_PROMPTS[style] || STYLE_PROMPTS.default;
};

// Get all valid style IDs
export const getValidStyleIds = (): string[] => {
  return Object.keys(STYLE_PROMPTS);
};
