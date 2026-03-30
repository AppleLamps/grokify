import { z } from 'zod';

export const factCheckXVerdictSchema = z.enum([
  'supported',
  'contradicted',
  'unclear',
  'not_checkable',
]);

export const factCheckXModeSchema = z.enum(['quick', 'deep']);

export const factCheckXSourceSchema = z
  .object({
    title: z.string().trim().min(1),
    url: z.string().trim().url(),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export const factCheckXClaimSchema = z
  .object({
    claim: z.string().trim().min(1),
    verdict: factCheckXVerdictSchema,
    rationale: z.string(),
  })
  .strict();

export const factCheckXOutputSchema = z
  .object({
    summaryMd: z.string(),
    claims: z.array(factCheckXClaimSchema),
    sources: z.array(factCheckXSourceSchema),
  })
  .strict();

export const factCheckXRequestSchema = z
  .object({
    url: z.string().trim().min(1),
    mode: factCheckXModeSchema.optional(),
  })
  .strict();

export const factCheckXApiResponseSchema = factCheckXOutputSchema
  .extend({
    normalizedUrl: z.string().url(),
    handle: z.string().trim().min(1).nullable(),
    postId: z.string().trim().min(1).nullable(),
    mode: factCheckXModeSchema,
    disclaimer: z.string().trim().min(1),
  })
  .strict();

export type FactCheckXMode = z.infer<typeof factCheckXModeSchema>;
export type FactCheckXVerdict = z.infer<typeof factCheckXVerdictSchema>;
export type FactCheckXSource = z.infer<typeof factCheckXSourceSchema>;
export type FactCheckXClaim = z.infer<typeof factCheckXClaimSchema>;
export type FactCheckXOutput = z.infer<typeof factCheckXOutputSchema>;
export type FactCheckXRequest = z.infer<typeof factCheckXRequestSchema>;
export type FactCheckXApiResponse = z.infer<typeof factCheckXApiResponseSchema>;
