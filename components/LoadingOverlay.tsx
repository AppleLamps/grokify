'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Sparkles, Paintbrush, Zap, TrendingUp, Eye, Brain, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoadingType = 'photo' | 'roast' | 'fbi' | 'osint' | 'caricature' | 'jointpic' | 'video';
type PhotoStage = 'analyze' | 'image' | 'video';

interface LoadingOverlayProps {
  type: LoadingType;
  stage?: PhotoStage;
  username?: string;
  username2?: string;
}

// Messages for each loading type and stage
const PHOTO_ANALYZE_MESSAGES = [
  { text: 'Searching through posts...', icon: Search },
  { text: 'Finding viral content...', icon: TrendingUp },
  { text: 'Analyzing media & aesthetics...', icon: Eye },
  { text: 'Hunting for greatest hits...', icon: Zap },
  { text: 'Studying the vibe...', icon: Brain },
  { text: 'Decoding the personality...', icon: Sparkles },
];

const PHOTO_IMAGE_MESSAGES = [
  { text: 'Mixing the colors...', icon: Palette },
  { text: 'Sketching the scene...', icon: Paintbrush },
  { text: 'Adding satirical details...', icon: Sparkles },
  { text: 'Perfecting the caricature...', icon: Eye },
  { text: 'Almost there...', icon: Zap },
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

// Estimated durations in seconds
const DURATIONS: Record<LoadingType, number> = {
  photo: 45,
  roast: 30,
  fbi: 30,
  osint: 90,
  caricature: 45,
  jointpic: 60,
  video: 90,
};

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

  // Calculate progress percentage
  const progress = useMemo(() => {
    const baseDuration = DURATIONS[type];
    let adjustedProgress = (elapsedSeconds / baseDuration) * 100;

    if (type === 'photo') {
      if (stage === 'analyze') {
        adjustedProgress = Math.min((elapsedSeconds / 30) * 70, 70);
      } else {
        adjustedProgress = 70 + Math.min((elapsedSeconds / 20) * 30, 29);
      }
    }

    if (type === 'jointpic') {
      if (stage === 'analyze') {
        adjustedProgress = Math.min((elapsedSeconds / 45) * 70, 70);
      } else {
        adjustedProgress = 70 + Math.min((elapsedSeconds / 20) * 30, 29);
      }
    }

    if (type === 'video') {
      if (stage === 'analyze') {
        adjustedProgress = Math.min((elapsedSeconds / 20) * 30, 30);
      } else {
        adjustedProgress = 30 + Math.min((elapsedSeconds / 60) * 69, 69);
      }
    }

    return Math.min(adjustedProgress, 99);
  }, [elapsedSeconds, type, stage]);

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
  const stepInfo = (type === 'photo' || type === 'jointpic' || type === 'video') ? (stage === 'analyze' ? 'Step 1 of 2' : 'Step 2 of 2') : null;
  const isJointPic = type === 'jointpic';
  const progressDots = 10;
  const filledDots = Math.floor((progress / 100) * progressDots);

  const getTitle = () => {
    if (type === 'photo') {
      return stage === 'analyze' ? 'Analyzing Profile' : 'Generating Artwork';
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

  // Get initials from username
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getTheme = () => {
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
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
            background: `
              radial-gradient(circle at 18% 18%, rgba(59,130,246,0.12), transparent 32%),
              radial-gradient(circle at 84% 18%, rgba(244,63,94,0.11), transparent 28%),
              radial-gradient(circle at 50% 82%, rgba(168,85,247,0.08), transparent 30%)
            `,
          }}
        />
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

      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.04] to-transparent" />
          <div
            className="absolute inset-x-[12%] top-[-20%] h-40 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${theme.panelGlow} 0%, transparent 72%)` }}
          />

          <div className="relative flex flex-col items-center text-center">
            <div className={cn(
              'mb-5 inline-flex items-center gap-2 rounded-full border bg-gradient-to-r px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]',
              theme.chip
            )}>
              <Sparkles className="h-3.5 w-3.5" />
              {type === 'jointpic' ? 'Dual Profile Synthesis' : type === 'video' ? 'Motion Engine' : 'Signal Chamber'}
            </div>

            {isJointPic && username && username2 ? (
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

            <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-black/20 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-6">
              <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Current Operation</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{getTitle()}</h2>
                </div>
                {stepInfo && (
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium tracking-[0.12em] text-neutral-300">
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

              <div className="mb-5 flex items-center justify-center gap-2 text-sm text-neutral-300 sm:text-base">
                <IconComponent className="h-4.5 w-4.5 shrink-0" style={{ color: theme.accent }} />
                <span>{currentMessage.text}</span>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(progress, 4)}%`,
                    background: theme.track,
                    boxShadow: `0 0 18px ${theme.glow}`,
                  }}
                />
              </div>

              <div className="mb-5 flex items-center justify-between text-xs font-medium text-neutral-500">
                <span>{Math.round(progress)}% complete</span>
                <span>{elapsedSeconds}s elapsed</span>
              </div>

              <div className="flex items-center justify-center gap-2">
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
        .animate-float-up {
          animation: float-up 2.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

