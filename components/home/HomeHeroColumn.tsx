'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import {
  ChevronRight,
  DollarSign,
  Flame,
  FlaskConical,
  Pencil,
  Upload,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const StyleSelectorModal = dynamic(
  () => import('@/components/StyleSelectorModal').then((mod) => mod.StyleSelectorModal),
  { ssr: false }
);

export interface HomeHeroColumnProps {
  isBusy: boolean;
  isStyleModalOpen: boolean;
  onStyleModalOpenChange: (open: boolean) => void;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  isCaricatureModalOpen: boolean;
  onCaricatureModalOpenChange: (open: boolean) => void;
  caricaturePreview: string | null;
  onCaricatureImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCaricatureGenerate: () => void;
  isJointPicModalOpen: boolean;
  onJointPicModalOpenChange: (open: boolean) => void;
  jointPicHandle1: string;
  jointPicHandle2: string;
  onJointPicHandle1Change: (v: string) => void;
  onJointPicHandle2Change: (v: string) => void;
  onJointPicGenerate: () => void;
}

function HomeHeroColumnInner({
  isBusy,
  isStyleModalOpen,
  onStyleModalOpenChange,
  selectedStyle,
  onSelectStyle,
  isCaricatureModalOpen,
  onCaricatureModalOpenChange,
  caricaturePreview,
  onCaricatureImageSelect,
  onCaricatureGenerate,
  isJointPicModalOpen,
  onJointPicModalOpenChange,
  jointPicHandle1,
  jointPicHandle2,
  onJointPicHandle1Change,
  onJointPicHandle2Change,
  onJointPicGenerate,
}: HomeHeroColumnProps) {
  return (
    <div className="space-y-6 text-center lg:text-left">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] flex items-center justify-center lg:justify-start gap-2 sm:gap-3">
        <svg viewBox="0 0 24 24" className="h-[0.8em] w-[0.8em] shrink-0 fill-white">
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
        <span className="gradient-text">pressionist</span>
      </h1>

      <p className="text-base sm:text-lg md:text-xl text-neutral-300 max-w-md mx-auto lg:mx-0 leading-relaxed tracking-tight">
        Turn any X timeline into bespoke AI artwork.<br />
        No login. No API keys. Just a username.
      </p>

      <a
        href="https://bags.fm/8F2FvujRh6zqoR4wtasocKgw4oPcu3MWK4MG77NwBAGS"
        target="_blank"
        rel="noopener noreferrer"
        className="text-base sm:text-lg text-neutral-400 hover:text-emerald-400 transition-colors inline-flex items-center justify-center lg:justify-start gap-2 group w-full lg:w-auto"
      >
        <DollarSign className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
        Funded by fees from <span className="font-bold text-emerald-400 group-hover:text-emerald-300">$GROKIFY</span>
      </a>

      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-amber-400/90 backdrop-blur-sm">
          <Flame className="w-3 h-3" />
          Powered by Grok AI
        </div>
        <a
          href="https://bags.fm/8F2FvujRh6zqoR4wtasocKgw4oPcu3MWK4MG77NwBAGS"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/40 text-sm font-semibold text-emerald-400 backdrop-blur-sm hover:from-emerald-500/25 hover:to-teal-500/25 hover:border-emerald-400/60 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]"
        >
          <DollarSign className="w-4 h-4" />
          <span className="font-mono tracking-wide">8F2Fvu...BAGs</span>
        </a>
      </div>

      <div className="flex justify-center lg:justify-start">
        <Link
          href="/prompt"
          className="group block w-[280px] sm:w-auto sm:max-w-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border border-amber-500/30 backdrop-blur-sm hover:from-amber-500/20 hover:via-orange-500/10 hover:to-rose-500/20 hover:border-amber-500/50 transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-sm sm:text-lg font-bold text-amber-400 group-hover:text-amber-300 transition-colors">Grokify Prompt</span>
            </div>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="hidden sm:block text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed text-left mt-2">
            Transform any idea into a polished AI prompt. Just describe what you want and let Grok craft the perfect prompt for you.
          </p>
        </Link>
      </div>

      <div className="flex justify-center lg:justify-start">
        <Link
          href="/imagine"
          className="group block w-[280px] sm:w-auto sm:max-w-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-pink-500/10 border border-violet-500/30 backdrop-blur-sm hover:from-violet-500/20 hover:via-fuchsia-500/10 hover:to-pink-500/20 hover:border-violet-500/50 transition-all shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-sm sm:text-lg font-bold text-violet-400 group-hover:text-violet-300 transition-colors">Grok Imagine</span>
            </div>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500/50 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="hidden sm:block text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed text-left mt-2">
            Generate stunning images and videos with xAI&apos;s latest Grok Imagine model. Just describe what you want!
          </p>
        </Link>
      </div>

      <Dialog
        open={isCaricatureModalOpen}
        onOpenChange={(open) => {
          onCaricatureModalOpenChange(open);
        }}
      >
        <DialogContent className="sm:max-w-md bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pencil className="w-5 h-5 text-purple-500" />
              Create Caricature
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Upload a photo and our Times Square artist will draw your caricature!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <label className="block">
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  caricaturePreview
                    ? 'border-purple-500/50 bg-purple-500/5'
                    : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
                }`}
              >
                {caricaturePreview ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={caricaturePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <p className="text-sm text-neutral-400">Click to change photo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-neutral-500" />
                    <p className="text-neutral-300 font-medium">Drop your photo here</p>
                    <p className="text-sm text-neutral-500">or click to browse</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCaricatureImageSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </label>

            <Button
              onClick={onCaricatureGenerate}
              disabled={!caricaturePreview}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              <Pencil className="w-5 h-5 mr-2" />
              Draw My Caricature
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isJointPicModalOpen}
        onOpenChange={(open) => {
          onJointPicModalOpenChange(open);
        }}
      >
        <DialogContent className="sm:max-w-md bg-neutral-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="w-5 h-5 text-amber-500" />
              Joint Picture
              <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 flex items-center gap-1">
                <FlaskConical className="w-3 h-3" />
                TEST
              </span>
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Enter two X usernames and we&apos;ll create one artwork that creatively represents both accounts together!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm text-neutral-400">First Account</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base font-semibold group-focus-within:text-amber-400 transition-colors">
                  @
                </span>
                <input
                  type="text"
                  value={jointPicHandle1}
                  onChange={(e) => onJointPicHandle1Change(e.target.value)}
                  placeholder="first_username"
                  className="w-full pl-9 pr-4 py-3 text-sm bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-colors duration-200"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Second Account</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base font-semibold group-focus-within:text-amber-400 transition-colors">
                  @
                </span>
                <input
                  type="text"
                  value={jointPicHandle2}
                  onChange={(e) => onJointPicHandle2Change(e.target.value)}
                  placeholder="second_username"
                  className="w-full pl-9 pr-4 py-3 text-sm bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-colors duration-200"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            <Button
              onClick={onJointPicGenerate}
              disabled={!jointPicHandle1.trim() || !jointPicHandle2.trim()}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50"
            >
              <Users className="w-5 h-5 mr-2" />
              Generate Joint Picture
            </Button>

            <p className="text-xs text-neutral-500 text-center">This is an experimental feature. Results may vary!</p>
          </div>
        </DialogContent>
      </Dialog>

      <StyleSelectorModal
        open={isStyleModalOpen}
        onOpenChange={onStyleModalOpenChange}
        selectedStyle={selectedStyle}
        onSelectStyle={onSelectStyle}
        disabled={isBusy}
      />
    </div>
  );
}

const HomeHeroColumn = memo(HomeHeroColumnInner);
export default HomeHeroColumn;
