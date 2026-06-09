'use client';

import { useState } from 'react';
import { Check, ChevronRight, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ArtStyle = {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'anime' | 'modern' | 'artistic' | 'fun';
};

export const ART_STYLES: ArtStyle[] = [
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
];

const CATEGORIES = [
  { id: 'classic', name: 'Classic' },
  { id: 'anime', name: 'Anime' },
  { id: 'modern', name: 'Modern' },
  { id: 'artistic', name: 'Art' },
  { id: 'fun', name: 'Fun' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

/**
 * Fallback gradient shown behind each preview until the real image at
 * /styles/{id}.webp loads (or if it is missing). See photoprompt.txt.
 */
const STYLE_PREVIEW_GRADIENTS: Record<string, string> = {
  default: 'linear-gradient(135deg,#e8c25a,#b5852b)',
  oil: 'linear-gradient(135deg,#7a5a36,#3e2a18)',
  watercolor: 'linear-gradient(135deg,#8ec5d8,#e6a6b8)',
  charcoal: 'linear-gradient(135deg,#4a4a4a,#0f0f0f)',
  renaissance: 'linear-gradient(135deg,#6b4f2a,#241608)',
  baroque: 'linear-gradient(135deg,#5a3b18,#120a04)',
  pencil: 'linear-gradient(135deg,#c4c4c4,#6f6f6f)',
  artdeco: 'linear-gradient(135deg,#caa24a,#1a2a2a)',
  ghibli: 'linear-gradient(135deg,#8fd0a8,#6fb0d8)',
  anime: 'linear-gradient(135deg,#ff9bc4,#7aa8ff)',
  manga: 'linear-gradient(135deg,#e8e8e8,#202020)',
  chibi: 'linear-gradient(135deg,#ffc0d8,#ffe7a8)',
  ukiyo: 'linear-gradient(135deg,#cf8a5a,#2a4a6a)',
  shonen: 'linear-gradient(135deg,#ff7a4d,#c0203a)',
  manhwa: 'linear-gradient(135deg,#f0a8c0,#9a78d8)',
  pixar: 'linear-gradient(135deg,#6fb0ff,#ffd07a)',
  cyberpunk: 'linear-gradient(135deg,#ff37c6,#27e6ff)',
  vaporwave: 'linear-gradient(135deg,#ff77d4,#79f5ff)',
  lowpoly: 'linear-gradient(135deg,#5a8ac0,#28324a)',
  neon: 'linear-gradient(135deg,#27e6ff,#a437ff)',
  minimalist: 'linear-gradient(135deg,#e8e8e8,#a8a8a8)',
  glitch: 'linear-gradient(135deg,#27ffd0,#ff2d6e)',
  synthwave: 'linear-gradient(135deg,#ff5b8a,#5b5bff)',
  hyperreal: 'linear-gradient(135deg,#9a9a9a,#2a2a2a)',
  comic: 'linear-gradient(135deg,#ffcf3a,#e6322a)',
  retro: 'linear-gradient(135deg,#ff5b8a,#ffcf3a)',
  impressionist: 'linear-gradient(135deg,#8fb8d8,#bfd89a)',
  surreal: 'linear-gradient(135deg,#d8a86a,#6a5ad8)',
  warhol: 'linear-gradient(135deg,#ff37c6,#ffe53a)',
  noir: 'linear-gradient(135deg,#d8d8d8,#101010)',
  expressionist: 'linear-gradient(135deg,#ff6a3a,#3a4ad8)',
  psychedelic: 'linear-gradient(135deg,#ff5bd0,#5bff9a)',
  sticker: 'linear-gradient(135deg,#ff8fc4,#8fd0ff)',
  claymation: 'linear-gradient(135deg,#e69a6a,#a86a4a)',
  graffiti: 'linear-gradient(135deg,#ff37a6,#37c6ff)',
  pixel: 'linear-gradient(135deg,#5ad8a8,#2a6ac0)',
  lego: 'linear-gradient(135deg,#ffcf3a,#e6322a)',
  papercut: 'linear-gradient(135deg,#f0c89a,#d89a6a)',
  balloon: 'linear-gradient(135deg,#ff5b8a,#5bd8ff)',
  plushie: 'linear-gradient(135deg,#ffc0a8,#c0a8ff)',
  vintage: 'linear-gradient(135deg,#c8a878,#6a5238)',
  steampunk: 'linear-gradient(135deg,#b8893a,#3a2a18)',
  fantasy: 'linear-gradient(135deg,#8a6ad8,#d8a83a)',
};

const FALLBACK_GRADIENT = 'linear-gradient(135deg,#3a3a3f,#18181b)';

function gradientFor(id: string): string {
  return STYLE_PREVIEW_GRADIENTS[id] ?? FALLBACK_GRADIENT;
}

/** Preview thumbnail: gradient placeholder that real art fades over once it loads. */
function StylePreview({ id, className }: { id: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)} style={{ background: gradientFor(id) }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.28) 1px, transparent 1.3px)', backgroundSize: '6px 6px' }}
      />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-26px_36px_-20px_rgba(0,0,0,0.6)]" />
      {!failed && (
        <img
          src={`/styles/${id}.webp`}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}

interface StyleSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
  disabled?: boolean;
}

export function StyleSelectorModal({
  open,
  onOpenChange,
  selectedStyle,
  onSelectStyle,
  disabled,
}: StyleSelectorModalProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('classic');

  const filteredStyles = ART_STYLES.filter((style) => style.category === activeCategory);
  const selectedStyleData = ART_STYLES.find((style) => style.id === selectedStyle);

  const handleSelectStyle = (styleId: string) => {
    onSelectStyle(styleId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-3xl border-white/10 bg-[#0f0f12] p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,0.7)] sm:max-w-3xl lg:max-w-4xl [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:border [&>button]:border-white/10 [&>button]:bg-white/[0.04] [&>button]:p-1.5 [&>button]:text-neutral-400 [&>button]:opacity-100 [&>button]:transition-all [&>button]:hover:border-white/20 [&>button]:hover:bg-white/[0.08] [&>button]:hover:text-white">
        <div className="border-b border-white/[0.08] px-6 pb-5 pt-6 sm:px-7">
          <DialogHeader className="space-y-0 text-left">
            <div className="flex items-start justify-between gap-4 pr-10">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-400">
                  <Palette className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-extrabold tracking-tight text-white">Choose a style</DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-neutral-400">
                    Pick the visual direction. You can change this before generating.
                  </DialogDescription>
                </div>
              </div>
              <div className="hidden shrink-0 rounded-xl border border-orange-500/40 bg-orange-500/10 px-3.5 py-2 text-right sm:block">
                <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.16em] text-orange-400/90">Current</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{selectedStyleData?.name ?? 'None'}</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.08] px-5 pt-3 sm:px-6">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  '-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-orange-400 text-orange-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                )}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredStyles.map((style) => {
              const isSelected = selectedStyle === style.id;

              return (
                <button
                  key={style.id}
                  onClick={() => handleSelectStyle(style.id)}
                  disabled={disabled}
                  className={cn(
                    'group flex flex-col overflow-hidden rounded-2xl border bg-white/[0.02] text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60',
                    isSelected
                      ? 'border-orange-500 ring-1 ring-orange-500'
                      : 'border-white/[0.08] hover:-translate-y-0.5 hover:border-white/20',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <StylePreview id={style.id} />
                    {isSelected && (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-white shadow-md">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold tracking-tight text-white">{style.name}</p>
                    <p className="mt-0.5 text-xs leading-snug text-neutral-500">{style.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StyleSelectorTriggerProps {
  selectedStyle: string;
  onClick: () => void;
  disabled?: boolean;
}

export function StyleSelectorTrigger({ selectedStyle, onClick, disabled }: StyleSelectorTriggerProps) {
  const style = ART_STYLES.find((s) => s.id === selectedStyle) || ART_STYLES[0];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white transition-all',
        'cursor-pointer hover:border-white/[0.16] hover:bg-white/[0.06] focus:outline-none focus-visible:border-orange-500/50',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-md border border-white/10"
          style={{ background: gradientFor(style.id) }}
        >
          <Palette className="h-3 w-3 text-white/70" />
        </span>
        <span className="truncate font-medium">{style.name}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />
    </button>
  );
}
