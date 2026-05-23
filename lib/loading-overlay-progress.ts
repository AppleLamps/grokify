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
  roast: { start: 6, end: 99, duration: 30, phaseLabel: 'ROAST SYNTHESIS' },
  fbi: { start: 7, end: 99, duration: 120, phaseLabel: 'BEHAVIORAL PROFILE' },
  osint: { start: 5, end: 99, duration: 90, phaseLabel: 'INTEL SWEEP' },
  caricature: { start: 8, end: 99, duration: 42, phaseLabel: 'PORTRAIT RENDER' },
};

const STAGED_CONFIG: Record<'photo' | 'jointpic' | 'video', Record<LoadingStage, ProgressConfig>> = {
  photo: {
    analyze: { start: 8, end: 68, duration: 26, phaseLabel: 'SIGNAL ACQUISITION' },
    image: { start: 70, end: 99, duration: 22, phaseLabel: 'VISUAL SYNTHESIS' },
    video: { start: 70, end: 99, duration: 22, phaseLabel: 'VISUAL SYNTHESIS' },
  },
  jointpic: {
    analyze: { start: 10, end: 64, duration: 38, phaseLabel: 'DUAL SUBJECT SCAN' },
    image: { start: 68, end: 99, duration: 24, phaseLabel: 'CROSSOVER RENDER' },
    video: { start: 68, end: 99, duration: 24, phaseLabel: 'CROSSOVER RENDER' },
  },
  video: {
    analyze: { start: 7, end: 34, duration: 18, phaseLabel: 'NARRATIVE SCAN' },
    image: { start: 38, end: 99, duration: 70, phaseLabel: 'MOTION RENDER' },
    video: { start: 38, end: 99, duration: 70, phaseLabel: 'MOTION RENDER' },
  },
};

function getStatusLabel(progress: number): string {
  if (progress < 18) return 'STANDBY';
  if (progress < 42) return 'ACQUIRING';
  if (progress < 68) return 'PROCESSING';
  if (progress < 88) return 'VALIDATING';
  return 'FINALIZING';
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
