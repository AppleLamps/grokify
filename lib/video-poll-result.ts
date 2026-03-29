import { z } from 'zod';

const VideoPollErrorSchema = z.union([
  z.string(),
  z.object({
    code: z.string().optional(),
    message: z.string().optional(),
  }),
]);

const VideoPollResultSchema = z.object({
  status: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  error: VideoPollErrorSchema.optional(),
  video: z.object({
    url: z.string().url().optional().nullable(),
    duration: z.number().optional(),
    respect_moderation: z.boolean().optional(),
  }).optional(),
});

export type ParsedVideoPollResult = {
  status: string | null;
  progress: number | null;
  videoUrl: string | null;
  duration: number | null;
  respectsModeration: boolean | null;
  error: string | null;
};

export function parseVideoPollResult(payload: unknown): ParsedVideoPollResult | null {
  const validation = VideoPollResultSchema.safeParse(payload);
  if (!validation.success) {
    return null;
  }

  const { status, progress, error, video } = validation.data;
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message ?? (status === 'failed' ? 'Video generation failed' : null);

  return {
    status: status ?? null,
    progress: progress ?? null,
    videoUrl: video?.url ?? null,
    duration: video?.duration ?? null,
    respectsModeration: video?.respect_moderation ?? null,
    error: errorMessage,
  };
}
