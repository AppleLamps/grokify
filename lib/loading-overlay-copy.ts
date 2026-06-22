import type { LoadingStage, LoadingType } from '@/lib/loading-overlay-progress';

export const PHOTO_PIPELINE_STEPS = [
  { label: 'POSTS', threshold: 12 },
  { label: 'MEDIA', threshold: 26 },
  { label: 'VIBE', threshold: 42 },
  { label: 'STYLE', threshold: 62 },
  { label: 'RENDER', threshold: 78 },
  { label: 'FINAL', threshold: 92 },
] as const;

export const OPERATION_CODENAMES: Record<LoadingType, string> = {
  photo: 'SILHOUETTE',
  roast: 'COMEDOWN',
  fbi: 'PAPERCLIP',
  osint: 'NIGHTJAR',
  caricature: 'SKETCHBOOK',
  jointpic: 'CROSSWIRE',
  video: 'KINETIC',
};

export const PHOTO_SEARCH_LOG = [
  'QUERY from:{user}',
  'QUERY from:{user} min_faves:10000',
  'QUERY from:{user} min_faves:5000',
  'QUERY from:{user} min_faves:1000',
  'QUERY from:{user} min_faves:500',
  'QUERY from:{user} min_faves:100',
  'QUERY from:{user} min_faves:10',
  'QUERY from:{user} min_faves:1',
  'QUERY from:{user} filter:media',
  'QUERY from:{user} filter:replies',
  'QUERY @{user}',
  'CORRELATE tone, topics, media cadence',
  'EXTRACT visual persona vector',
  'LOCK art direction parameters',
];

export const JOINTPIC_SEARCH_LOG = [
  'QUERY from:{user1}',
  'QUERY from:{user1} min_faves:10000',
  'QUERY from:{user1} min_faves:5000',
  'QUERY from:{user1} min_faves:1000',
  'QUERY from:{user1} min_faves:500',
  'QUERY from:{user1} min_faves:100',
  'QUERY from:{user1} min_faves:10',
  'QUERY from:{user1} min_faves:1',
  'QUERY from:{user2}',
  'QUERY from:{user2} min_faves:10000',
  'QUERY from:{user2} min_faves:5000',
  'QUERY from:{user2} min_faves:1000',
  'QUERY from:{user2} min_faves:500',
  'QUERY from:{user2} min_faves:100',
  'QUERY from:{user2} min_faves:10',
  'QUERY from:{user2} min_faves:1',
  'QUERY from:{user1} filter:media',
  'QUERY from:{user2} filter:media',
  'QUERY @{user1} @{user2}',
  'CORRELATE dual-subject themes',
  'SYNTHESIZE crossover prompt',
];

export const PHOTO_RENDER_LOG = [
  'COMPILE prompt stack',
  'ALLOCATE render channel',
  'INJECT satirical detail layer',
  'REFINE composition vectors',
  'AWAIT output declassification',
];

const STATUS_MESSAGES: Record<string, string[]> = {
  'photo-analyze': [
    'CORRELATING timeline artifacts...',
    'RANKING high-signal posts...',
    'MAPPING visual language...',
    'MODELING persona vectors...',
    'LOCKING art direction...',
  ],
  'photo-image': [
    'COMPILING image prompt stack...',
    'RENDERING composition layers...',
    'INJECTING satirical detail...',
    'REFINING scene parameters...',
    'FINALIZING output packet...',
  ],
  'roast': [
    'INDEXING public timeline...',
    'ISOLATING behavioral weak points...',
    'CALIBRATING wit parameters...',
    'DRAFTING therapy summary...',
    'SEALING roast packet...',
  ],
  'fbi': [
    'ACCESSING public record streams...',
    'ANALYZING behavioral patterns...',
    'CROSS-REFERENCING data points...',
    'BUILDING psychological profile...',
    'CLASSIFYING subject disposition...',
  ],
  'osint': [
    'INITIATING reconnaissance sweep...',
    'GATHERING open-source intelligence...',
    'MAPPING social graph edges...',
    'ANALYZING engagement telemetry...',
    'COMPILING subject dossier...',
  ],
  'caricature': [
    'ACQUIRING facial landmark data...',
    'IDENTIFYING exaggeration vectors...',
    'RENDERING marker-style output...',
    'APPLYING satirical emphasis...',
    'FINALIZING portrait packet...',
  ],
  'jointpic-analyze': [
    'SCANNING primary subject...',
    'SCANNING secondary subject...',
    'CORRELATING dual timelines...',
    'IDENTIFYING crossover vectors...',
    'BUILDING composite scene...',
  ],
  'jointpic-image': [
    'MERGING subject render planes...',
    'SKETCHING dual-subject composition...',
    'INJECTING crossover detail...',
    'REFINING composite output...',
    'AWAITING final render...',
  ],
  'video-analyze': [
    'SCANNING viral moment index...',
    'ANALYZING motion signatures...',
    'EXTRACTING narrative arc...',
    'MODELING kinetic profile...',
    'LOCKING video brief...',
  ],
  'video-video': [
    'PROVISIONING render pipeline...',
    'ANIMATING scene sequence...',
    'ENCODING motion layer...',
    'RENDERING 10s output buffer...',
    'FINALIZING media packet...',
  ],
};

export function getStatusMessages(type: LoadingType, stage?: LoadingStage): string[] {
  if (type === 'photo') {
    return stage === 'image' ? STATUS_MESSAGES['photo-image'] : STATUS_MESSAGES['photo-analyze'];
  }
  if (type === 'jointpic') {
    return stage === 'image' ? STATUS_MESSAGES['jointpic-image'] : STATUS_MESSAGES['jointpic-analyze'];
  }
  if (type === 'video') {
    return stage === 'video' ? STATUS_MESSAGES['video-video'] : STATUS_MESSAGES['video-analyze'];
  }
  return STATUS_MESSAGES[type];
}

export function getOperationTitle(type: LoadingType, stage?: LoadingStage): string {
  if (type === 'photo') {
    return stage === 'image' ? 'PHASE 02 — VISUAL SYNTHESIS' : 'PHASE 01 — SIGNAL ACQUISITION';
  }
  if (type === 'jointpic') {
    return stage === 'image' ? 'PHASE 02 — CROSSOVER RENDER' : 'PHASE 01 — DUAL SUBJECT SCAN';
  }
  if (type === 'video') {
    return stage === 'video' ? 'PHASE 02 — MOTION RENDER' : 'PHASE 01 — NARRATIVE SCAN';
  }
  if (type === 'roast') return 'OPERATION — THERAPY SUMMARY';
  if (type === 'fbi') return 'OPERATION — BEHAVIORAL PROFILE';
  if (type === 'osint') return 'OPERATION — OSINT DOSSIER';
  return 'OPERATION — VISUAL ACQUISITION';
}

export function getMissionLabel(type: LoadingType): string {
  switch (type) {
    case 'photo':
      return 'PROFILE ART SYNTHESIS';
    case 'jointpic':
      return 'DUAL SUBJECT COMPOSITE';
    case 'video':
      return 'KINETIC PROFILE VIDEO';
    case 'roast':
      return 'COMEDY ROAST PACKET';
    case 'fbi':
      return 'BEHAVIORAL ANALYSIS';
    case 'osint':
      return 'OPEN SOURCE DOSSIER';
    case 'caricature':
      return 'CARICATURE RENDER';
    default:
      return 'CLASSIFIED OUTPUT';
  }
}

export function interpolateLogTemplate(
  template: string,
  username?: string,
  username2?: string,
): string {
  return template
    .replaceAll('{user}', username || 'subject')
    .replaceAll('{user1}', username || 'subject_a')
    .replaceAll('{user2}', username2 || 'subject_b');
}

export function getSearchLog(type: LoadingType, stage?: LoadingStage): string[] {
  if (type === 'photo' && stage !== 'image') {
    return PHOTO_SEARCH_LOG;
  }
  if (type === 'photo' && stage === 'image') {
    return PHOTO_RENDER_LOG;
  }
  if (type === 'jointpic' && stage !== 'image') {
    return JOINTPIC_SEARCH_LOG;
  }
  if (type === 'jointpic' && stage === 'image') {
    return PHOTO_RENDER_LOG;
  }
  if (type === 'video' && stage === 'analyze') {
    return PHOTO_SEARCH_LOG;
  }
  if (type === 'video' && stage === 'video') {
    return PHOTO_RENDER_LOG;
  }
  return [];
}
