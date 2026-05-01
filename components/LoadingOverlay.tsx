'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Sparkles, Paintbrush, Zap, TrendingUp, Eye, Brain, Palette, Check, TimerReset, Activity, Radar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLoadingOverlayProgress, type LoadingType, type LoadingStage } from '@/lib/loading-overlay-progress';

interface LoadingOverlayProps {
  type: LoadingType;
  stage?: LoadingStage;
  username?: string;
  username2?: string;
}

// Messages for each loading type and stage
const PHOTO_ANALYZE_MESSAGES = [
  { text: 'Indexing public timeline signal...', icon: Search },
  { text: 'Ranking high-signal posts...', icon: TrendingUp },
  { text: 'Scanning visual language...', icon: Eye },
  { text: 'Extracting cultural fingerprints...', icon: Zap },
  { text: 'Modeling persona vectors...', icon: Brain },
  { text: 'Locking art direction...', icon: Sparkles },
];

const PHOTO_IMAGE_MESSAGES = [
  { text: 'Compiling the image prompt...', icon: Palette },
  { text: 'Rendering composition layers...', icon: Paintbrush },
  { text: 'Injecting satirical detail...', icon: Sparkles },
  { text: 'Refining facial and scene cues...', icon: Eye },
  { text: 'Finalizing output packet...', icon: Zap },
];

const ROAST_MESSAGES = [
  { text: 'Reading your timeline...', icon: Search },
  { text: 'Finding your weak spots...', icon: Eye },
  { text: 'Sharpening the wit...', icon: Zap },
  { text: 'Crafting devastating burns...', icon: Sparkles },
  { text: 'Adding a pinch of love...', icon: Brain },
];

const FBI_MESSAGES = [
  { text: 'Accessing public records...', icon: Search },
  { text: 'Analyzing behavioral patterns...', icon: Brain },
  { text: 'Cross-referencing data points...', icon: Eye },
  { text: 'Building psychological profile...', icon: Sparkles },
  { text: 'Classifying threat level...', icon: Zap },
];

const OSINT_MESSAGES = [
  { text: 'Initiating reconnaissance...', icon: Search },
  { text: 'Gathering intelligence...', icon: Eye },
  { text: 'Mapping social connections...', icon: TrendingUp },
  { text: 'Analyzing engagement patterns...', icon: Brain },
  { text: 'Compiling comprehensive dossier...', icon: Sparkles },
];

const CARICATURE_MESSAGES = [
  { text: 'Studying your features...', icon: Eye },
  { text: 'Finding your best angle...', icon: Search },
  { text: 'Exaggerating the good stuff...', icon: Sparkles },
  { text: 'Sketching with marker...', icon: Paintbrush },
  { text: 'Adding comedic flair...', icon: Zap },
  { text: 'Almost done with your portrait...', icon: Palette },
];

const JOINTPIC_ANALYZE_MESSAGES = [
  { text: 'Searching first profile...', icon: Search },
  { text: 'Searching second profile...', icon: Search },
  { text: 'Analyzing both timelines...', icon: Eye },
  { text: 'Finding common ground...', icon: TrendingUp },
  { text: 'Spotting contrasts...', icon: Zap },
  { text: 'Crafting the crossover...', icon: Brain },
  { text: 'Building the scene...', icon: Sparkles },
];

const JOINTPIC_IMAGE_MESSAGES = [
  { text: 'Merging two worlds...', icon: Palette },
  { text: 'Sketching the duo...', icon: Paintbrush },
  { text: 'Adding satirical details...', icon: Sparkles },
  { text: 'Perfecting the crossover...', icon: Eye },
  { text: 'Almost there...', icon: Zap },
];

const VIDEO_ANALYZE_MESSAGES = [
  { text: 'Searching through posts...', icon: Search },
  { text: 'Finding viral moments...', icon: TrendingUp },
  { text: 'Analyzing motion & energy...', icon: Eye },
  { text: 'Studying the vibe...', icon: Brain },
  { text: 'Crafting the narrative...', icon: Sparkles },
];

const VIDEO_GENERATION_MESSAGES = [
  { text: 'Setting up the scene...', icon: Palette },
  { text: 'Animating the story...', icon: Paintbrush },
  { text: 'Adding motion effects...', icon: Zap },
  { text: 'Rendering 10 seconds of magic...', icon: Sparkles },
  { text: 'Encoding the video...', icon: Eye },
  { text: 'Almost there...', icon: Check },
];

// Activity log entries for joint pic (simulated search queries)
const ACTIVITY_LOG_ENTRIES = [
  { query: 'from:{user1}', status: 'searching' },
  { query: 'from:{user1} min_faves:100', status: 'pending' },
  { query: 'from:{user2}', status: 'pending' },
  { query: 'from:{user2} min_faves:100', status: 'pending' },
  { query: 'from:{user1} filter:media', status: 'pending' },
  { query: 'from:{user2} filter:media', status: 'pending' },
  { query: '@{user1} @{user2}', status: 'pending' },
  { query: 'Analyzing themes...', status: 'pending' },
  { query: 'Finding connections...', status: 'pending' },
  { query: 'Generating prompt...', status: 'pending' },
];

const PHOTO_PIPELINE_STEPS = [
  { label: 'POSTS', threshold: 12 },
  { label: 'MEDIA', threshold: 26 },
  { label: 'VIBE', threshold: 42 },
  { label: 'STYLE', threshold: 62 },
  { label: 'RENDER', threshold: 78 },
  { label: 'FINAL', threshold: 92 },
];

// Particle component for the orb trails
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}

export function LoadingOverlay({ type, stage, username, username2 }: LoadingOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activityIndex, setActivityIndex] = useState(0);
  const [gradientAngle, setGradientAngle] = useState(0);

  // Get messages based on type and stage
  const messages = useMemo(() => {
    if (type === 'photo') {
      return stage === 'image' ? PHOTO_IMAGE_MESSAGES : PHOTO_ANALYZE_MESSAGES;
    }
    if (type === 'jointpic') {
      return stage === 'image' ? JOINTPIC_IMAGE_MESSAGES : JOINTPIC_ANALYZE_MESSAGES;
    }
    if (type === 'video') {
      return stage === 'video' ? VIDEO_GENERATION_MESSAGES : VIDEO_ANALYZE_MESSAGES;
    }
    if (type === 'roast') return ROAST_MESSAGES;
    if (type === 'fbi') return FBI_MESSAGES;
    if (type === 'caricature') return CARICATURE_MESSAGES;
    return OSINT_MESSAGES;
  }, [type, stage]);

  const progressState = useMemo(
    () => getLoadingOverlayProgress({ type, stage, elapsedSeconds }),
    [elapsedSeconds, stage, type]
  );
  const progress = progressState.progress;

  // Generate activity log with replaced usernames
  const activityLog = useMemo(() => {
    return ACTIVITY_LOG_ENTRIES.map((entry, idx) => ({
      ...entry,
      query: entry.query
        .replace('{user1}', username || 'user1')
        .replace('{user2}', username2 || 'user2'),
      status: idx < activityIndex ? 'done' : idx === activityIndex ? 'searching' : 'pending',
    }));
  }, [username, username2, activityIndex]);

  // Elapsed time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Gradient animation
  useEffect(() => {
    const timer = setInterval(() => {
      setGradientAngle(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Activity log progression
  useEffect(() => {
    if (type === 'jointpic' && stage === 'analyze') {
      const timer = setInterval(() => {
        setActivityIndex(prev => Math.min(prev + 1, ACTIVITY_LOG_ENTRIES.length - 1));
      }, 3500);
      return () => clearInterval(timer);
    }
  }, [type, stage]);

  // Generate particles
  const generateParticle = useCallback(() => {
    const colors = ['#f59e0b', '#eab308', '#fbbf24', '#fcd34d', '#fef3c7'];
    return {
      id: Date.now() + Math.random(),
      x: 50 + (Math.random() - 0.5) * 30,
      y: 50 + (Math.random() - 0.5) * 30,
      size: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.7,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }, []);

  // Particle spawning - more particles as progress increases
  useEffect(() => {
    const spawnRate = Math.max(100, 500 - progress * 4);
    const timer = setInterval(() => {
      setParticles(prev => {
        const newParticles = [...prev, generateParticle()];
        // Keep max 30 particles
        if (newParticles.length > 30) {
          return newParticles.slice(-30);
        }
        return newParticles;
      });
    }, spawnRate);
    return () => clearInterval(timer);
  }, [progress, generateParticle]);

  // Particle cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setParticles(prev => prev.slice(1));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Reset message index when stage changes (but NOT elapsed time - timer should be continuous)
  useEffect(() => {
    if ((type === 'photo' || type === 'jointpic') && stage === 'image') {
      // Reset activity index for joint pic, but keep elapsed seconds running
      setActivityIndex(0);
    }
    setMessageIndex(0);
  }, [stage, type]);

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[messageIndex] || messages[0];
  const IconComponent = currentMessage.icon;
  const isPhoto = type === 'photo';
  const stepInfo = (type === 'photo' || type === 'jointpic' || type === 'video') ? (stage === 'analyze' ? 'Step 1 of 2' : 'Step 2 of 2') : null;
  const isJointPic = type === 'jointpic';
  const progressDots = 10;
  const filledDots = Math.max(1, Math.ceil((progress / 100) * progressDots));
  const photoBars = useMemo(
    () => Array.from({ length: 18 }, (_, index) => 24 + ((index * 19 + progress) % 56)),
    [progress]
  );

  const getTitle = () => {
    if (type === 'photo') {
      return stage === 'analyze' ? 'Mapping X Profile' : 'Synthesizing Artwork';
    }
    if (type === 'jointpic') {
      return stage === 'analyze' ? 'Analyzing Both Profiles' : 'Generating Joint Picture';
    }
    if (type === 'video') {
      return stage === 'analyze' ? 'Analyzing Profile' : 'Generating Video';
    }
    if (type === 'roast') return 'Crafting Your Roast';
    if (type === 'fbi') return 'Building Profile';
    if (type === 'caricature') return 'Drawing Your Caricature';
    return 'Compiling Dossier';
  };

  const progressSummary = () => {
    if (type === 'photo') {
      if (stage === 'image') {
        if (progress < 78) return 'Transforming the profile read into a visual prompt stack.';
        return 'Rendering final image instructions and preparing the output.';
      }
      if (progress < 25) return 'Opening the public signal stream and building a timeline fingerprint.';
      if (progress < 55) return 'Ranking posts, media cues, and tone into a usable style profile.';
      if (progress < 75) return 'Compressing persona signals into a coherent art direction.';
      return 'Profile scan is complete. Handing off to image synthesis.';
    }
    if (progress < 20) return 'Systems are warming up and establishing the first pass.';
    if (progress < 50) return 'The model is gathering signal and building a coherent read.';
    if (progress < 80) return 'The output is taking shape and the visual direction is stabilizing.';
    return 'Final passes are underway before the result is returned.';
  };

  // Get initials from username
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getTheme = () => {
    if (type === 'photo') {
      return {
        glow: 'rgba(56,189,248,0.30)',
        ringA: '#38bdf8',
        ringB: '#fb923c',
        accent: '#fde68a',
        panelGlow: 'rgba(56,189,248,0.16)',
        track: 'linear-gradient(90deg, #38bdf8 0%, #f43f5e 52%, #fbbf24 100%)',
        chip: 'from-sky-500/16 via-rose-500/10 to-amber-500/12 border-sky-300/20 text-sky-100',
      };
    }

    if (type === 'video') {
      return {
        glow: 'rgba(34,211,238,0.30)',
        ringA: '#22d3ee',
        ringB: '#3b82f6',
        accent: '#67e8f9',
        panelGlow: 'rgba(34,211,238,0.16)',
        track: 'linear-gradient(90deg, #22d3ee 0%, #3b82f6 100%)',
        chip: 'from-cyan-500/16 to-blue-500/10 border-cyan-400/20 text-cyan-200',
      };
    }

    if (type === 'jointpic') {
      return {
        glow: 'rgba(251,191,36,0.28)',
        ringA: '#f59e0b',
        ringB: '#fbbf24',
        accent: '#fde68a',
        panelGlow: 'rgba(245,158,11,0.16)',
        track: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
        chip: 'from-amber-500/16 to-yellow-500/10 border-amber-400/20 text-amber-200',
      };
    }

    return {
      glow: 'rgba(244,63,94,0.28)',
      ringA: '#f43f5e',
      ringB: '#fb923c',
      accent: '#fdba74',
      panelGlow: 'rgba(244,63,94,0.16)',
      track: 'linear-gradient(90deg, #f43f5e 0%, #fb923c 55%, #fbbf24 100%)',
      chip: 'from-rose-500/16 to-orange-500/10 border-rose-400/20 text-rose-200',
    };
  };

  const theme = getTheme();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overflow-x-hidden py-4 sm:items-center sm:py-6"
      style={{
        background: `linear-gradient(${gradientAngle}deg,
          rgba(5,5,7,0.88) 0%,
          rgba(11,12,18,0.92) 28%,
          rgba(15,18,30,0.90) 52%,
          rgba(22,12,18,0.92) 76%,
          rgba(5,5,7,0.9) 100%)`,
        backdropFilter: 'blur(18px)',
      }}
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: isPhoto
              ? `
                linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(251,146,60,0.035) 1px, transparent 1px),
                radial-gradient(circle at 50% 18%, rgba(56,189,248,0.14), transparent 32%),
                radial-gradient(circle at 72% 78%, rgba(251,146,60,0.10), transparent 34%)
              `
              : `
                radial-gradient(circle at 18% 18%, rgba(59,130,246,0.12), transparent 32%),
                radial-gradient(circle at 84% 18%, rgba(244,63,94,0.11), transparent 28%),
                radial-gradient(circle at 50% 82%, rgba(168,85,247,0.08), transparent 30%)
              `,
            backgroundSize: isPhoto ? '42px 42px, 42px 42px, auto, auto' : undefined,
          }}
        />
        {isPhoto && (
          <div className="absolute inset-0 opacity-40 [background:linear-gradient(180deg,transparent_0%,rgba(56,189,248,0.10)_50%,transparent_100%)] animate-scan-field" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%,transparent_78%,rgba(255,255,255,0.02))]" />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-float-up"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity * 0.45,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-xs sm:max-w-2xl">
        <div className="relative max-h-none overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-4 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:rounded-[32px] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.04] to-transparent" />
          <div
            className="absolute inset-x-[12%] top-[-20%] h-40 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${theme.panelGlow} 0%, transparent 72%)` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_28%,transparent_72%,rgba(255,255,255,0.03))]" />

          <div className="relative flex flex-col items-center text-center">
            <div className={cn(
              'mb-5 inline-flex items-center gap-2 rounded-full border bg-gradient-to-r px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]',
              theme.chip
            )}>
              <Sparkles className="h-3.5 w-3.5" />
              {type === 'photo' ? 'X Signal Renderer' : type === 'jointpic' ? 'Dual Profile Synthesis' : type === 'video' ? 'Motion Engine' : 'Signal Chamber'}
            </div>

            {isPhoto ? (
              <div className="relative mb-5 w-full max-w-md overflow-hidden border border-sky-300/15 bg-black/45 p-3 text-left shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:mb-8 sm:p-5">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:28px_28px]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-orange-300/70 to-transparent" />
                <div className="absolute inset-x-4 top-0 h-16 bg-gradient-to-b from-sky-300/10 to-transparent animate-scan-field" />

                <div className="relative grid gap-3 sm:grid-cols-[132px_1fr] sm:items-center sm:gap-4">
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32">
                    <div
                      className="absolute inset-0 opacity-90"
                      style={{
                        background: `conic-gradient(from 0deg, ${theme.ringA} 0%, transparent 18%, ${theme.ringB} 36%, transparent 54%, ${theme.ringA} 72%, transparent 100%)`,
                        WebkitMask: 'radial-gradient(transparent 56%, black 58%, black 64%, transparent 66%)',
                        mask: 'radial-gradient(transparent 56%, black 58%, black 64%, transparent 66%)',
                        animation: 'spin-slow 7s linear infinite',
                      }}
                    />
                    <div
                      className="absolute inset-4 opacity-80"
                      style={{
                        background: `conic-gradient(from 180deg, transparent 0%, ${theme.ringB} 24%, transparent 48%, ${theme.ringA} 74%, transparent 100%)`,
                        WebkitMask: 'radial-gradient(transparent 60%, black 62%, black 69%, transparent 71%)',
                        mask: 'radial-gradient(transparent 60%, black 62%, black 69%, transparent 71%)',
                        animation: 'spin-reverse 9s linear infinite',
                      }}
                    />
                    <div className="relative flex h-16 w-16 items-center justify-center border border-white/10 bg-[linear-gradient(145deg,rgba(8,12,20,0.95),rgba(16,20,30,0.78))] shadow-[inset_0_1px_18px_rgba(255,255,255,0.10)] sm:h-20 sm:w-20">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(56,189,248,0.24),transparent_44%)]" />
                      <div className="absolute inset-x-2 top-1/2 h-px bg-sky-200/70 shadow-[0_0_16px_rgba(56,189,248,0.9)] animate-scan-line" />
                      <IconComponent className="relative z-10 h-7 w-7 sm:h-8 sm:w-8" style={{ color: theme.accent }} />
                    </div>
                  </div>

                  <div className="relative min-w-0 space-y-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-sky-200/60">
                        Target Profile
                      </div>
                      <div className="mt-1 truncate text-xl font-semibold text-white">
                        @{username || 'x_profile'}
                      </div>
                    </div>

                    <div className="flex h-12 items-end gap-1.5 border border-white/10 bg-white/[0.025] px-3 py-2 sm:h-16">
                      {photoBars.map((height, index) => (
                        <span
                          key={index}
                          className="flex-1 rounded-t-sm bg-gradient-to-t from-sky-400 via-rose-400 to-amber-300 opacity-80"
                          style={{
                            height: `${height}%`,
                            animation: `signal-bar 1.2s ease-in-out ${index * 45}ms infinite alternate`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-mono text-[9px] uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.14em]">
                      {['scan', 'style', stage === 'image' ? 'render' : 'model'].map((label, index) => (
                        <div key={label} className="border border-white/10 bg-white/[0.03] px-2 py-2 text-center text-neutral-400">
                          <div className="mx-auto mb-1 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.75)]" />
                          {String(index + 1).padStart(2, '0')} {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : isJointPic && username && username2 ? (
              <div className="relative mb-8 flex items-center justify-center gap-6 sm:gap-10">
                <div
                  className="absolute left-1/2 top-1/2 h-[2px] w-24 -translate-x-1/2 -translate-y-1/2 sm:w-36"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${theme.ringA} 25%, ${theme.ringB} 50%, ${theme.ringA} 75%, transparent 100%)`,
                    boxShadow: `0 0 18px ${theme.glow}`,
                  }}
                />
                {[username, username2].map((name, index) => (
                  <div key={name} className="relative">
                    <div
                      className="absolute inset-[-14px] rounded-full blur-2xl"
                      style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
                    />
                    <div
                      className="absolute inset-[-5px] rounded-full opacity-80"
                      style={{
                        background: `conic-gradient(from ${index === 0 ? '45deg' : '225deg'}, transparent 0%, ${theme.ringA} 20%, transparent 42%, ${theme.ringB} 72%, transparent 100%)`,
                        WebkitMask: 'radial-gradient(transparent 64%, black 66%, black 72%, transparent 74%)',
                        mask: 'radial-gradient(transparent 64%, black 66%, black 72%, transparent 74%)',
                        animation: `${index === 0 ? 'spin-slow' : 'spin-reverse'} 7s linear infinite`,
                      }}
                    />
                    <div
                      className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 text-lg font-semibold text-white shadow-[inset_0_1px_10px_rgba(255,255,255,0.12)] sm:h-24 sm:w-24 sm:text-xl"
                      style={{
                        background: index === 0
                          ? 'linear-gradient(135deg, rgba(244,63,94,0.95) 0%, rgba(251,146,60,0.88) 100%)'
                          : 'linear-gradient(135deg, rgba(245,158,11,0.95) 0%, rgba(250,204,21,0.88) 100%)',
                        boxShadow: `0 18px 50px rgba(0,0,0,0.35), 0 0 28px ${theme.glow}`,
                      }}
                    >
                      {getInitials(name)}
                    </div>
                    <p className="mt-3 text-xs font-medium tracking-[0.12em] text-neutral-400 sm:text-sm">@{name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full blur-3xl"
                  style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
                />
                <div
                  className="absolute inset-0 rounded-full opacity-90"
                  style={{
                    background: `conic-gradient(from 0deg, ${theme.ringA} 0%, ${theme.ringB} 38%, transparent 58%, ${theme.ringA} 82%, transparent 100%)`,
                    WebkitMask: 'radial-gradient(transparent 63%, black 65%, black 71%, transparent 73%)',
                    mask: 'radial-gradient(transparent 63%, black 65%, black 71%, transparent 73%)',
                    animation: 'spin-slow 8s linear infinite',
                  }}
                />
                <div
                  className="absolute inset-[14px] rounded-full opacity-75"
                  style={{
                    background: `conic-gradient(from 180deg, transparent 0%, ${theme.ringB} 24%, transparent 48%, ${theme.ringA} 74%, transparent 100%)`,
                    WebkitMask: 'radial-gradient(transparent 67%, black 69%, black 74%, transparent 76%)',
                    mask: 'radial-gradient(transparent 67%, black 69%, black 74%, transparent 76%)',
                    animation: 'spin-reverse 10s linear infinite',
                  }}
                />
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 text-white shadow-[inset_0_1px_12px_rgba(255,255,255,0.18)]"
                  style={{
                    background: `linear-gradient(145deg, ${theme.ringA} 0%, ${theme.ringB} 100%)`,
                    boxShadow: `0 18px 50px rgba(0,0,0,0.35), 0 0 35px ${theme.glow}`,
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),transparent_42%)]" />
                  <IconComponent className="relative z-10 h-9 w-9" />
                </div>
              </div>
            )}

            <div className="w-full max-w-xl rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(4,6,12,0.72),rgba(8,10,18,0.52))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_60px_rgba(0,0,0,0.18)] sm:rounded-[28px] sm:px-6 sm:py-5">
              <div className="relative mb-3 text-center">
                <div className="mx-auto max-w-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Current Operation</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{getTitle()}</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-neutral-400">
                    {progressSummary()}
                  </p>
                </div>
                {stepInfo && (
                  <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium tracking-[0.12em] text-neutral-300 sm:absolute sm:right-0 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2">
                    {stepInfo}
                  </div>
                )}
              </div>

              {isJointPic && stage === 'analyze' && (
                <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-neutral-300">
                  <div className="relative h-2 w-2 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-emerald-400" />
                    <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  </div>
                  <span className="truncate font-mono">{activityLog[activityIndex]?.query || 'Searching...'}</span>
                </div>
              )}

              {isPhoto && (
                <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {PHOTO_PIPELINE_STEPS.map((step) => {
                    const isActive = progress >= step.threshold;
                    return (
                      <div
                        key={step.label}
                        className={cn(
                          'border px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
                          isActive
                            ? 'border-sky-300/25 bg-sky-300/[0.08] text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.08)]'
                            : 'border-white/10 bg-white/[0.025] text-neutral-600'
                        )}
                      >
                        <div
                          className={cn(
                            'mx-auto mb-1 h-1 w-5 transition-colors',
                            isActive ? 'bg-gradient-to-r from-sky-300 to-amber-300' : 'bg-white/10'
                          )}
                        />
                        {step.label}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mb-5 flex items-center justify-center gap-2 text-sm text-neutral-300 sm:text-base">
                <IconComponent className="h-4.5 w-4.5 shrink-0" style={{ color: theme.accent }} />
                <span>{currentMessage.text}</span>
              </div>

              {isPhoto && (
                <div className="mb-4 sm:hidden">
                  <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(progress, 4)}%`,
                        background: theme.track,
                        boxShadow: `0 0 18px ${theme.glow}`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                    <span>{progress}% complete</span>
                    <span>{progressState.statusLabel}</span>
                  </div>
                </div>
              )}

              <div className={cn(
                'mb-5 grid grid-cols-1 gap-3 text-left sm:grid-cols-3',
                isPhoto && 'hidden sm:grid'
              )}>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    <Radar className="h-3.5 w-3.5" />
                    Active Phase
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{progressState.phaseLabel}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    <Activity className="h-3.5 w-3.5" />
                    Status
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{progressState.statusLabel}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    <TimerReset className="h-3.5 w-3.5" />
                    Elapsed
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{elapsedSeconds}s</p>
                </div>
              </div>

              <div className={cn('mb-4 h-2 overflow-hidden rounded-full bg-white/[0.06]', isPhoto && 'hidden sm:block')}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(progress, 4)}%`,
                    background: theme.track,
                    boxShadow: `0 0 18px ${theme.glow}`,
                  }}
                />
              </div>

              <div className={cn('mb-5 flex items-center justify-between text-xs font-medium text-neutral-500', isPhoto && 'hidden sm:flex')}>
                <span>{progress}% complete</span>
                <span>{progressState.phaseLabel}</span>
              </div>

              <div className={cn('flex items-center justify-center gap-2', isPhoto && 'hidden sm:flex')}>
                {[...Array(progressDots)].map((_, i) => (
                  <div
                    key={i}
                    className="transition-all duration-500"
                    style={{
                      width: i < filledDots ? 16 : 8,
                      height: 8,
                      borderRadius: 999,
                      background: i <= filledDots
                        ? theme.track
                        : 'rgba(255,255,255,0.10)',
                      opacity: i <= filledDots ? 1 : 0.45,
                      boxShadow: i < filledDots ? `0 0 12px ${theme.glow}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: var(--opacity); }
          100% { transform: translateY(-40px) scale(0.5); opacity: 0; }
        }
        @keyframes scan-field {
          0% { transform: translateY(-24%); opacity: 0; }
          18% { opacity: 0.55; }
          100% { transform: translateY(124%); opacity: 0; }
        }
        @keyframes scan-line {
          0% { transform: translateY(-30px); opacity: 0.25; }
          50% { opacity: 1; }
          100% { transform: translateY(30px); opacity: 0.25; }
        }
        @keyframes signal-bar {
          from { transform: scaleY(0.72); filter: brightness(0.82); }
          to { transform: scaleY(1); filter: brightness(1.18); }
        }
        .animate-float-up {
          animation: float-up 2.2s ease-out forwards;
        }
        .animate-scan-field {
          animation: scan-field 3.6s ease-in-out infinite;
        }
        .animate-scan-line {
          animation: scan-line 2.1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

