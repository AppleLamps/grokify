export type LoadingType = 'photo' | 'roast' | 'fbi' | 'osint' | 'caricature' | 'jointpic' | 'video';
export type LoadingStage = 'analyze' | 'image' | 'video';

interface ProgressConfig {
  start: number;
  end: number;
  duration: number;
  phaseLabel: string;
}

export interface LoadingOverlayProgressInput {
  type: LoadingType;
  stage?: LoadingStage;
  elapsedSeconds: number;
}

export interface LoadingOverlayProgressResult {
  progress: number;
  phaseLabel: string;
  statusLabel: string;
}

const SINGLE_STAGE_CONFIG: Record<Exclude<LoadingType, 'photo' | 'jointpic' | 'video'>, ProgressConfig> = {
  roast: { start: 6, end: 99, duration: 30, phaseLabel: 'Roast Synthesis' },
  fbi: { start: 7, end: 99, duration: 120, phaseLabel: 'Behavioral Profile' },
  osint: { start: 5, end: 99, duration: 90, phaseLabel: 'Intelligence Sweep' },
  caricature: { start: 8, end: 99, duration: 42, phaseLabel: 'Caricature Render' },
};

const STAGED_CONFIG: Record<'photo' | 'jointpic' | 'video', Record<LoadingStage, ProgressConfig>> = {
  photo: {
    analyze: { start: 8, end: 68, duration: 26, phaseLabel: 'Profile Analysis' },
    image: { start: 70, end: 99, duration: 22, phaseLabel: 'Artwork Render' },
    video: { start: 70, end: 99, duration: 22, phaseLabel: 'Artwork Render' },
  },
  jointpic: {
    analyze: { start: 10, end: 64, duration: 38, phaseLabel: 'Dual Profile Sync' },
    image: { start: 68, end: 99, duration: 24, phaseLabel: 'Crossover Render' },
    video: { start: 68, end: 99, duration: 24, phaseLabel: 'Crossover Render' },
  },
  video: {
    analyze: { start: 7, end: 34, duration: 18, phaseLabel: 'Narrative Scan' },
    image: { start: 38, end: 99, duration: 70, phaseLabel: 'Video Render' },
    video: { start: 38, end: 99, duration: 70, phaseLabel: 'Video Render' },
  },
};

function getStatusLabel(progress: number): string {
  if (progress < 18) return 'Calibrating';
  if (progress < 42) return 'Collecting signal';
  if (progress < 68) return 'Building output';
  if (progress < 88) return 'Refining';
  return 'Finalizing';
}

function interpolateProgress(elapsedSeconds: number, config: ProgressConfig): number {
  const ratio = Math.min(Math.max(elapsedSeconds / config.duration, 0), 1);
  const easedRatio = 1 - Math.pow(1 - ratio, 2);
  const interpolated = config.start + (config.end - config.start) * easedRatio;
  return Math.min(Math.round(interpolated), 99);
}

export function getLoadingOverlayProgress({
  type,
  stage,
  elapsedSeconds,
}: LoadingOverlayProgressInput): LoadingOverlayProgressResult {
  const clampedElapsedSeconds = Math.max(0, elapsedSeconds);

  if (type === 'photo' || type === 'jointpic' || type === 'video') {
    const resolvedStage =
      stage ??
      (type === 'video' ? 'analyze' : 'analyze');
    const config = STAGED_CONFIG[type][resolvedStage];
    const progress = interpolateProgress(clampedElapsedSeconds, config);
    return {
      progress,
      phaseLabel: config.phaseLabel,
      statusLabel: getStatusLabel(progress),
    };
  }

  const config = SINGLE_STAGE_CONFIG[type];
  const progress = interpolateProgress(clampedElapsedSeconds, config);
  return {
    progress,
    phaseLabel: config.phaseLabel,
    statusLabel: getStatusLabel(progress),
  };
}
