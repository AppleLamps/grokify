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
import { SITE_NAME } from '@/lib/site';
import {
  getHomePhotoUnavailableMessage,
  getHomeVideoUnavailableMessage,
  isGrokImageGenerationEnabled,
  isGrokVideoGenerationEnabled,
} from '@/lib/grok-image-availability';

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
  const grokImageGenerationEnabled = isGrokImageGenerationEnabled();
  const grokVideoGenerationEnabled = isGrokVideoGenerationEnabled();

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

  const secondaryBtn =
    'w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-white font-medium rounded-xl hover:bg-white/[0.07] hover:border-white/[0.16] transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2';

  return (
    <div id="grokify-generate" className="iphone-container relative mx-auto scroll-mt-24">
      <div className="phone-glow" />

      <div className="iphone-frame">
        <div className="action-button" />
        <div className="volume-up" />
        <div className="volume-down" />
        <div className="power-button" />

        <div className="iphone-screen">
          <div className="dynamic-island" />

          <div className="phone-statusbar">
            <span>9:41</span>
            <span className="sb-right">
              <svg viewBox="0 0 18 12" width="17" height="11" fill="currentColor" aria-hidden="true">
                <rect x="0" y="7" width="3" height="5" rx="1" />
                <rect x="5" y="4" width="3" height="8" rx="1" />
                <rect x="10" y="1.5" width="3" height="10.5" rx="1" />
                <rect x="15" y="0" width="3" height="12" rx="1" opacity="0.4" />
              </svg>
              <svg viewBox="0 0 18 14" width="16" height="12" fill="currentColor" aria-hidden="true">
                <path d="M9 3c2.7 0 5.2 1 7 2.7l-1.6 1.7A7.7 7.7 0 0 0 9 5.3 7.7 7.7 0 0 0 3.6 7.4L2 5.7A10.2 10.2 0 0 1 9 3Zm0 4c1.5 0 2.9.6 4 1.5l-1.7 1.8A3.6 3.6 0 0 0 9 9.3c-.9 0-1.7.3-2.3.8L5 8.5A6 6 0 0 1 9 7Zm0 4c.7 0 1.3.3 1.7.8L9 12.6 7.3 11.8c.4-.5 1-.8 1.7-.8Z" />
              </svg>
              <svg viewBox="0 0 26 13" width="24" height="12" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="21" height="11" rx="3" stroke="currentColor" strokeOpacity="0.4" />
                <rect x="3" y="3" width="16" height="7" rx="1.5" fill="currentColor" />
                <rect x="23.5" y="4.5" width="1.6" height="4" rx="0.8" fill="currentColor" fillOpacity="0.5" />
              </svg>
            </span>
          </div>

          <div className="iphone-screen-content justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="space-y-3.5 relative">
              <div className="text-center pb-0.5">
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-[0.8em] w-[0.8em] shrink-0 fill-white">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                  <span className="gradient-text">{SITE_NAME}</span>
                </h2>
              </div>

              <div className="space-y-2.5">
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-base font-mono group-focus-within:text-orange-400 transition-colors">
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
                    className="w-full pl-9 pr-11 py-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-colors duration-200"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={wrapPhoto}
                    disabled={isBusy || !handle}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center bg-white/10 rounded-lg text-white hover:bg-white/20 disabled:opacity-0 transition-all"
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
                        ? 'bg-white/[0.08] border-white/20 text-white'
                        : 'bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    🍌 Nano Banana Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectedModelChange('grok-imagine')}
                    disabled={isBusy || !grokImageGenerationEnabled}
                    title={grokImageGenerationEnabled ? 'Use Grok Imagine' : getHomePhotoUnavailableMessage()}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200 ${
                      selectedModel === 'grok-imagine'
                        ? 'bg-white/[0.08] border-white/20 text-white'
                        : grokImageGenerationEnabled
                          ? 'bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                          : 'bg-white/[0.02] border-white/[0.06] text-neutral-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    ⚡ Grok Imagine
                  </button>
                </div>

                {!grokImageGenerationEnabled && (
                  <p
                    className="text-[11px] leading-snug text-neutral-400 text-center bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2"
                    title={getHomePhotoUnavailableMessage()}
                  >
                    Grok Imagine is paused. Nano Banana Pro is active.
                  </p>
                )}

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={wrapPhoto}
                    disabled={isBusy}
                    className="w-full px-4 py-3 bg-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-950/40 hover:bg-orange-400 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Photo
                  </button>
                  {/* Generate Video button — temporarily hidden */}
                  {/* <button
                    type="button"
                    onClick={wrapVideo}
                    disabled={isBusy || !grokVideoGenerationEnabled}
                    title={grokVideoGenerationEnabled ? 'Generate video' : getHomeVideoUnavailableMessage()}
                    className={secondaryBtn}
                  >
                    <Video className="w-4 h-4" />
                    Generate Video
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-white/20 text-white/90 rounded-full border border-white/30 flex items-center gap-0.5">
                      <FlaskConical className="w-2.5 h-2.5" />
                      BETA
                    </span>
                  </button>
                  {!grokVideoGenerationEnabled && (
                    <p className="text-xs text-neutral-400 text-center bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2">
                      {getHomeVideoUnavailableMessage()}
                    </p>
                  )} */}
                  <button
                    type="button"
                    onClick={wrapFbi}
                    disabled={isBusy}
                    className={secondaryBtn}
                  >
                    <Shield className="w-4 h-4 text-neutral-300" />
                    FBI Profile
                  </button>
                  <button
                    type="button"
                    onClick={onCaricatureOpen}
                    disabled={isBusy}
                    className={secondaryBtn}
                  >
                    <Pencil className="w-4 h-4 text-neutral-300" />
                    Caricature
                  </button>
                  <button
                    type="button"
                    onClick={onJointPicOpen}
                    disabled={isBusy}
                    className={secondaryBtn}
                  >
                    <Users className="w-4 h-4 text-neutral-300" />
                    Joint Picture
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white/10 text-neutral-400 rounded border border-white/10 flex items-center gap-0.5">
                      <FlaskConical className="w-2.5 h-2.5" />
                      TEST
                    </span>
                  </button>
                </div>
              </div>

              {inputError && (
                <p className="text-sm text-red-400 text-center bg-red-500/10 py-2 rounded-lg">{inputError}</p>
              )}

              <div>
                <div className="flex items-center gap-2.5 pt-1 pb-1">
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-600">Examples</span>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTION_HANDLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setHandle(s);
                        setInputError('');
                      }}
                      disabled={isBusy}
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.05] border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.1] hover:border-white/[0.16] transition-all"
                    >
                      @{s}
                    </button>
                  ))}
                </div>
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
