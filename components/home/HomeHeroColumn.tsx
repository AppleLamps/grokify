'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import {
  Check,
  ChevronRight,
  Flame,
  FlaskConical,
  Pencil,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SITE_NAME } from '@/lib/site';
import {
  getImagineImageUnavailableMessage,
  getImagineVideoUnavailableMessage,
  isGrokImageGenerationEnabled,
  isGrokVideoGenerationEnabled,
} from '@/lib/grok-image-availability';

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
  const grokImageGenerationEnabled = isGrokImageGenerationEnabled();
  const grokVideoGenerationEnabled = isGrokVideoGenerationEnabled();

  return (
    <div className="space-y-4 text-center lg:-mt-2 lg:text-left">
      <div className="flex items-center justify-center lg:justify-start gap-2.5">
        <svg viewBox="0 0 24 24" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 fill-white">
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
        <span className="gradient-text text-3xl sm:text-4xl font-extrabold tracking-tight">{SITE_NAME}</span>
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-white leading-[1.03]">
        Turn any X profile<br className="hidden sm:block" /> into <span className="gradient-text">AI artwork.</span>
      </h1>

      <div className="space-y-2">
        <p className="text-base sm:text-lg text-neutral-300 max-w-md mx-auto lg:mx-0 leading-relaxed">
          Paste a username, choose a style, and generate a profile-inspired image in seconds.
        </p>
        <p className="text-sm sm:text-base text-neutral-500 max-w-md mx-auto lg:mx-0">
          No login. No API keys. Just a username.
        </p>
      </div>

      <div className="inline-flex flex-col sm:flex-row items-stretch overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm">
        <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-neutral-300">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          Powered by Grok AI
        </span>
        <a
          href="https://bags.fm/8F2FvujRh6zqoR4wtasocKgw4oPcu3MWK4MG77NwBAGS"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border-t border-white/[0.08] px-4 py-2.5 font-mono font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/10 sm:border-l sm:border-t-0"
        >
          $GROKIFY
        </a>
        <a
          href="https://bags.fm/8F2FvujRh6zqoR4wtasocKgw4oPcu3MWK4MG77NwBAGS"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 border-t border-white/[0.08] px-4 py-2.5 text-neutral-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 sm:border-l sm:border-t-0"
        >
          Funded by fees
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        </a>
      </div>

      <div className="space-y-2.5 pt-1">
        <p className="text-[11px] font-mono font-medium uppercase tracking-[0.18em] text-neutral-500 text-center lg:text-left">
          What it does
        </p>
        <div className="flex flex-col gap-2.5 max-w-md mx-auto lg:mx-0">
          <a
            href="#grokify-generate"
            className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-400">
              <UserRound className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">Generate profile art from an X username</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">Create unique images inspired by any public profile.</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-600 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-400" />
          </a>

          <Link
            href="/fact-check"
            className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-400">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">Fact-check a post with sources</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">Paste a post URL, run web and X search, and get a clean verdict with sources.</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-600 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-400" />
          </Link>

          <Link
            href="/prompt"
            className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-400">
              <Wand2 className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">Turn rough ideas into polished prompts</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">Transform any idea into a clear, powerful AI prompt.</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-600 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-400" />
          </Link>
        </div>
      </div>

      {/* Grok Imagine nav card — temporarily hidden */}
      {/* <div className="flex justify-center lg:justify-start">
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
            {grokImageGenerationEnabled && grokVideoGenerationEnabled
              ? 'Generate stunning images and videos with xAI\'s latest Grok Imagine model. Just describe what you want!'
              : `${getImagineImageUnavailableMessage()} ${getImagineVideoUnavailableMessage()}`}
          </p>
        </Link>
      </div> */}

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
