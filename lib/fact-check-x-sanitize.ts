import {
  factCheckXOutputSchema,
  type FactCheckXOutput,
  type FactCheckXSource,
} from '@/lib/fact-check-x-schema';

const MARKDOWN_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;
const RAW_URL_RE = /https?:\/\/[^\s<>()\]]+/gi;
const NUMERIC_CITATION_RE = /\[\s*\^?\s*\d+[a-zA-Z]?(?:\s*[-,]\s*\d+[a-zA-Z]?)*\s*\]/g;
const DOUBLE_BRACKET_CITATION_RE = /\[\[\s*\^?\s*\d+[a-zA-Z]?(?:\s*[-,]\s*\d+[a-zA-Z]?)*\s*\]\]/g;
const WHITESPACE_RE = /\s+/g;

function isCitationLikeLabel(label: string): boolean {
  return /^\s*\^?\s*\d+[a-zA-Z]?(?:\s*[-,]\s*\d+[a-zA-Z]?)*\s*$/.test(label);
}

function sanitizeDisplayText(value: string): string {
  const withoutMarkdownLinks = value.replace(MARKDOWN_LINK_RE, (_match, label: string) => {
    return isCitationLikeLabel(label) ? '' : label;
  });

  const withoutUrls = withoutMarkdownLinks.replace(RAW_URL_RE, '');
  const withoutCitations = withoutUrls
    .replace(DOUBLE_BRACKET_CITATION_RE, '')
    .replace(NUMERIC_CITATION_RE, '');

  return withoutCitations.replace(WHITESPACE_RE, ' ').trim();
}

function dedupeSources(sources: FactCheckXSource[]): FactCheckXSource[] {
  const seen = new Set<string>();
  const deduped: FactCheckXSource[] = [];

  for (const source of sources) {
    const key = source.url.trim();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push({
      ...source,
      url: key,
    });
  }

  return deduped;
}

export function sanitizeFactCheckXOutput(input: FactCheckXOutput): FactCheckXOutput {
  const parsed = factCheckXOutputSchema.parse(input);

  return {
    summaryMd: sanitizeDisplayText(parsed.summaryMd),
    claims: parsed.claims.map((claim) => ({
      ...claim,
      rationale: sanitizeDisplayText(claim.rationale),
    })),
    sources: dedupeSources(parsed.sources),
    ...(parsed.sourceAnalysis != null
      ? { sourceAnalysis: sanitizeDisplayText(parsed.sourceAnalysis) }
      : {}),
  };
}

export type { FactCheckXOutput } from '@/lib/fact-check-x-schema';
