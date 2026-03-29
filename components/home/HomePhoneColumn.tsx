'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ChevronDown,
  FlaskConical,
  Pencil,
  Shield,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';

const StyleSelectorTrigger = dynamic(
  () => import('@/components/StyleSelectorModal').then((mod) => mod.StyleSelectorTrigger),
  { ssr: false }
);

const SUGGESTION_HANDLES = ['levelsio', 'pmarca', 'OfficialLoganK'];

export interface HomePhoneColumnProps {
  isBusy: boolean;
  selectedStyle: string;
  selectedModel: 'nano-banana' | 'grok-imagine';
  onSelectedModelChange: (model: 'nano-banana' | 'grok-imagine') => void;
  onOpenStyleModal: () => void;
  /** Increment from parent to clear the username field (e.g. after "Generate another"). */
  clearUsernameSignal: number;
  onGeneratePhoto: (normalizedHandle: string) => void | Promise<void>;
  onGenerateVideo: (normalizedHandle: string) => void | Promise<void>;
  onRoast: (normalizedHandle: string) => void | Promise<void>;
  onFbiProfile: (normalizedHandle: string) => void | Promise<void>;
  onCaricatureOpen: () => void;
  onJointPicOpen: () => void;
}

function HomePhoneColumnInner({
  isBusy,
  selectedStyle,
  selectedModel,
  onSelectedModelChange,
  onOpenStyleModal,
  clearUsernameSignal,
  onGeneratePhoto,
  onGenerateVideo,
  onRoast,
  onFbiProfile,
  onCaricatureOpen,
  onJointPicOpen,
}: HomePhoneColumnProps) {
  const [handle, setHandle] = useState('');
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    if (clearUsernameSignal === 0) return;
    setHandle('');
    setInputError('');
  }, [clearUsernameSignal]);

  const requireHandle = useCallback((raw: string): string | null => {
    const normalized = raw.trim().replace('@', '');
    if (!normalized) {
      setInputError('Enter a username');
      return null;
    }
    setInputError('');
    return normalized;
  }, []);

  const wrapPhoto = useCallback(() => {
    const h = requireHandle(handle);
    if (h) void onGeneratePhoto(h);
  }, [handle, requireHandle, onGeneratePhoto]);

  const wrapVideo = useCallback(() => {
    const h = requireHandle(handle);
    if (h) void onGenerateVideo(h);
  }, [handle, requireHandle, onGenerateVideo]);

  const wrapRoast = useCallback(() => {
    const h = requireHandle(handle);
    if (h) void onRoast(h);
  }, [handle, requireHandle, onRoast]);

  const wrapFbi = useCallback(() => {
    const h = requireHandle(handle);
    if (h) void onFbiProfile(h);
  }, [handle, requireHandle, onFbiProfile]);

  return (
    <div className="iphone-container relative mx-auto">
      <div className="phone-glow" />

      <div className="iphone-frame">
        <div className="action-button" />
        <div className="volume-up" />
        <div className="volume-down" />
        <div className="power-button" />

        <div className="iphone-screen">
          <div className="dynamic-island" />

          <div className="iphone-screen-content justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="space-y-5 relative">
              <div className="text-center pb-1">
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-[0.85em] w-[0.85em] shrink-0 fill-white">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                  <span className="gradient-text">pressionist</span>
                </h2>
              </div>

              <div className="space-y-3">
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base font-semibold group-focus-within:text-rose-400 transition-colors">
                    @
                  </span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => {
                      setHandle(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && !isBusy && wrapPhoto()}
                    disabled={isBusy}
                    placeholder="username"
                    className="w-full pl-9 pr-12 py-3.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-colors duration-200"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={wrapPhoto}
                    disabled={isBusy || !handle}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 disabled:opacity-0 transition-all"
                    aria-label="Generate"
                  >
                    <ChevronDown className="-rotate-90 w-4 h-4" />
                  </button>
                </div>

                <StyleSelectorTrigger
                  selectedStyle={selectedStyle}
                  onClick={onOpenStyleModal}
                  disabled={isBusy}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectedModelChange('nano-banana')}
                    disabled={isBusy}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200 ${
                      selectedModel === 'nano-banana'
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-yellow-400'
                        : 'bg-white/[0.05] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    🍌 Nano Banana Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectedModelChange('grok-imagine')}
                    disabled={isBusy}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200 ${
                      selectedModel === 'grok-imagine'
                        ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-violet-500/50 text-violet-400'
                        : 'bg-white/[0.05] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    ⚡ Grok Imagine
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={wrapPhoto}
                    disabled={isBusy}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-rose-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Photo
                  </button>
                  <button
                    type="button"
                    onClick={wrapVideo}
                    disabled={isBusy}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-cyan-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2 relative"
                  >
                    <Video className="w-4 h-4" />
                    Generate Video
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-white/20 text-white/90 rounded-full border border-white/30 flex items-center gap-0.5">
                      <FlaskConical className="w-2.5 h-2.5" />
                      BETA
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={wrapFbi}
                    disabled={isBusy}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-red-700 to-red-900 text-white font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-red-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    FBI Profile
                  </button>
                  <button
                    type="button"
                    onClick={onCaricatureOpen}
                    disabled={isBusy}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-purple-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Caricature
                  </button>
                  <button
                    type="button"
                    onClick={onJointPicOpen}
                    disabled={isBusy}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-amber-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2 relative"
                  >
                    <Users className="w-4 h-4" />
                    Joint Picture
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-black/20 text-black/70 rounded-full border border-black/20 flex items-center gap-0.5">
                      <FlaskConical className="w-2.5 h-2.5" />
                      TEST
                    </span>
                  </button>
                </div>
              </div>

              {inputError && (
                <p className="text-sm text-red-500 text-center bg-red-500/10 py-2 rounded-lg">{inputError}</p>
              )}

              <div className="flex flex-wrap justify-center gap-2 pt-3">
                {SUGGESTION_HANDLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setHandle(s);
                      setInputError('');
                    }}
                    disabled={isBusy}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.06] border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.15] transition-all"
                  >
                    @{s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="home-indicator" />
        </div>
      </div>

      <div className="phone-shadow" />
    </div>
  );
}

const HomePhoneColumn = memo(HomePhoneColumnInner);
export default HomePhoneColumn;
