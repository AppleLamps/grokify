/**
 * Parser utility for OSINT report formatting
 * Extracts citations and section headers for better rendering
 */

// Regex to match [[n]](url) citation patterns
const CITATION_REGEX = /\[\[(\d+)\]\]\((https?:\/\/[^\s)]+)\)/g;

// Regex to match section headers like "A) EXECUTIVE SUMMARY" or "B) VIRAL CONTENT ANALYSIS"
const SECTION_HEADER_REGEX = /^([A-Z])\)\s+(.+)$/gm;

export interface ParsedCitation {
  number: number;
  url: string;
}

export interface ParsedReport {
  content: string;
  citations: Map<number, string>;
}

/**
 * Parse the OSINT report text to extract citations
 * Replaces [[n]](url) patterns with {{CITE:n}} placeholders
 */
export function parseOsintReport(text: string): ParsedReport {
  const citations = new Map<number, string>();

  // Extract all citations and build the map
  let match;
  const citationRegex = new RegExp(CITATION_REGEX.source, 'g');
  while ((match = citationRegex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    const url = match[2];
    citations.set(num, url);
  }

  // Replace citation patterns with placeholders
  const content = text.replace(CITATION_REGEX, '{{CITE:$1}}');

  return { content, citations };
}

/**
 * Check if a line is a section header (e.g., "A) EXECUTIVE SUMMARY")
 */
export function isSectionHeader(line: string): { letter: string; title: string } | null {
  const match = line.match(/^([A-Z])\)\s+(.+)$/);
  if (match) {
    return { letter: match[1], title: match[2] };
  }
  return null;
}

/**
 * Get all unique citations sorted by number
 */
export function getSortedCitations(citations: Map<number, string>): ParsedCitation[] {
  return Array.from(citations.entries())
    .map(([number, url]) => ({ number, url }))
    .sort((a, b) => a.number - b.number);
}

/**
 * Strip all citation markers and their associated URLs from text.
 * Handles [[n]](url), [[n]] followed by (url), and standalone [[n]] patterns.
 * Also removes leftover bare parenthesized x.com/twitter.com status URLs.
 */
export function stripCitations(text: string): string {
  let result = text;

  // Remove [[n]](url) with optional whitespace between ]] and (
  result = result.replace(/\[\[\d+\]\]\s*\(https?:\/\/[^\s)]+\)/g, '');

  // Remove standalone [[n]] markers
  result = result.replace(/\[\[\d+\]\]/g, '');

  // Remove leftover bare parenthesized x.com/twitter.com status URLs
  result = result.replace(/\(https?:\/\/(?:x|twitter)\.com\/[^\s)]+\)/g, '');

  // Clean up extra whitespace left behind (collapse multiple spaces, trim lines)
  result = result.replace(/ {2,}/g, ' ');
  result = result.replace(/^ +| +$/gm, '');

  // Remove blank lines that may have been left behind (but preserve intentional paragraph breaks)
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
