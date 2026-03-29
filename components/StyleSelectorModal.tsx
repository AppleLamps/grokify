'use client';

import { useState } from 'react';
import { Check, ChevronRight, Palette, Sparkles } from 'lucide-react';
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

const CATEGORY_ACCENTS: Record<CategoryId, { tab: string; glow: string; badge: string }> = {
  classic: {
    tab: 'bg-gradient-to-r from-amber-400/22 via-yellow-300/14 to-amber-500/22 border-amber-300/40 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_10px_30px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,248,220,0.12)]',
    glow: 'bg-gradient-to-b from-rose-500/14 via-orange-500/8 to-transparent',
    badge: 'border-rose-400/20 bg-rose-500/12 text-rose-200',
  },
  anime: {
    tab: 'bg-gradient-to-r from-amber-400/22 via-yellow-300/14 to-amber-500/22 border-amber-300/40 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_10px_30px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,248,220,0.12)]',
    glow: 'bg-gradient-to-b from-fuchsia-500/14 via-pink-500/8 to-transparent',
    badge: 'border-fuchsia-400/20 bg-fuchsia-500/12 text-fuchsia-200',
  },
  modern: {
    tab: 'bg-gradient-to-r from-amber-400/22 via-yellow-300/14 to-amber-500/22 border-amber-300/40 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_10px_30px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,248,220,0.12)]',
    glow: 'bg-gradient-to-b from-cyan-500/14 via-sky-500/8 to-transparent',
    badge: 'border-cyan-400/20 bg-cyan-500/12 text-cyan-200',
  },
  artistic: {
    tab: 'bg-gradient-to-r from-amber-400/22 via-yellow-300/14 to-amber-500/22 border-amber-300/40 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_10px_30px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,248,220,0.12)]',
    glow: 'bg-gradient-to-b from-amber-500/14 via-orange-500/8 to-transparent',
    badge: 'border-amber-400/20 bg-amber-500/12 text-amber-200',
  },
  fun: {
    tab: 'bg-gradient-to-r from-amber-400/22 via-yellow-300/14 to-amber-500/22 border-amber-300/40 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_10px_30px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,248,220,0.12)]',
    glow: 'bg-gradient-to-b from-emerald-500/14 via-teal-500/8 to-transparent',
    badge: 'border-emerald-400/20 bg-emerald-500/12 text-emerald-200',
  },
};

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
  const activeCategoryData = CATEGORIES.find((category) => category.id === activeCategory) ?? CATEGORIES[0];
  const activeAccent = CATEGORY_ACCENTS[activeCategory];

  const handleSelectStyle = (styleId: string) => {
    onSelectStyle(styleId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden rounded-[28px] border-white/10 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.14),_transparent_28%),linear-gradient(180deg,_rgba(24,24,27,0.96),_rgba(12,12,14,0.98))] p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:max-w-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:border [&>button]:border-white/10 [&>button]:bg-white/[0.04] [&>button]:p-1.5 [&>button]:text-neutral-400 [&>button]:opacity-100 [&>button]:transition-all [&>button]:hover:border-white/20 [&>button]:hover:bg-white/[0.08] [&>button]:hover:text-white">
        <div className="relative overflow-hidden border-b border-white/8 px-6 pb-5 pt-6 sm:px-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-rose-500/10 via-orange-500/5 to-transparent" />
          <DialogHeader className="relative space-y-4 text-left">
            <div className="flex items-start justify-between gap-4 pr-10">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-gradient-to-r from-rose-500/14 to-orange-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200">
                  <Sparkles className="h-3.5 w-3.5 text-rose-300" />
                  Style System
                </div>
                <DialogTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-white">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-500/18 via-orange-500/10 to-transparent shadow-[0_12px_35px_rgba(244,63,94,0.16)]">
                    <Palette className="h-5 w-5 text-rose-300" />
                  </div>
                  Choose Style
                </DialogTitle>
              </div>
              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Current</p>
                <p className="mt-1 text-sm font-medium text-white">{selectedStyleData?.name ?? 'No style'}</p>
              </div>
            </div>
            <DialogDescription className="max-w-xl text-sm leading-relaxed text-neutral-400">
              Pick a visual direction that matches the energy of the image. The selector stays in Grokify&apos;s core brand language rather than changing identity per model.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5 sm:px-7">
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24', activeAccent.glow)} />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Featured Selection</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 shadow-inner shadow-black/20">
                    <Palette className="h-4.5 w-4.5 text-rose-300" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedStyleData?.name ?? 'No style selected'}</p>
                    <p className="text-sm text-neutral-400">{selectedStyleData?.description ?? 'Generate with the raw prompt only.'}</p>
                  </div>
                </div>
              </div>
              <div className={cn('inline-flex self-start rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] sm:self-auto', activeAccent.badge)}>
                {activeCategoryData.name} Collection
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/8 bg-black/20 p-1.5">
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category.id;
              const categoryAccent = CATEGORY_ACCENTS[category.id];

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'min-w-[74px] flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold tracking-[0.08em] transition-all duration-200',
                    isActive
                      ? categoryAccent.tab
                      : 'border-transparent bg-transparent text-neutral-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-7">
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredStyles.map((style) => {
              const isSelected = selectedStyle === style.id;

              return (
                <button
                  key={style.id}
                  onClick={() => handleSelectStyle(style.id)}
                  disabled={disabled}
                  className={cn(
                    'group relative overflow-hidden rounded-[22px] border p-4 text-left transition-all duration-200',
                    isSelected
                      ? 'border-rose-400/28 bg-gradient-to-br from-rose-500/16 via-orange-500/10 to-transparent shadow-[0_18px_45px_rgba(244,63,94,0.16)]'
                      : 'border-white/8 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.05]',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div className={cn(
                    'pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b opacity-0 transition-opacity',
                    isSelected
                      ? 'from-rose-500/14 via-orange-500/8 to-transparent opacity-100'
                      : 'from-white/[0.06] to-transparent group-hover:opacity-100'
                  )} />
                  <div className="relative flex h-full flex-col justify-between gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-base font-semibold tracking-tight',
                            isSelected ? 'text-white' : 'text-white/95'
                          )}>
                            {style.name}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-200">
                              <Check className="h-3 w-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-neutral-400">
                          {style.description}
                        </p>
                      </div>
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-all',
                        isSelected
                          ? 'border-rose-400/20 bg-white/[0.08] text-rose-200'
                          : 'border-white/8 bg-black/15 text-neutral-600 group-hover:text-white/80'
                      )}>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                        {activeCategoryData.name}
                      </span>
                      <span className={cn(
                        'text-[11px] font-medium transition-colors',
                        isSelected ? 'text-rose-200' : 'text-neutral-500 group-hover:text-neutral-300'
                      )}>
                        Use this look
                      </span>
                    </div>
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
        'w-full rounded-2xl border border-white/[0.12] bg-white/[0.08] px-4 py-3 text-sm text-white transition-all hover:bg-white/[0.12]',
        'flex items-center justify-between gap-2 cursor-pointer focus:bg-white/[0.12] focus:border-rose-500/50 focus:outline-none',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-neutral-400" />
        <span className="font-medium">{style.name}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-neutral-400" />
    </button>
  );
}
