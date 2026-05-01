/**
 * Fetch with timeout support using AbortController
 * Prevents requests from hanging indefinitely
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Default timeout values for different API calls
 */
export const API_TIMEOUTS = {
  /** xAI Grok API - standard analysis */
  GROK_ANALYSIS: 60000,
  /** xAI Grok API - enhanced account analysis with multi-search (2 minutes) */
  ENHANCED_ACCOUNT_ANALYSIS: 120000,
  /** xAI Grok API - FBI profile reports use search + long-form report generation */
  FBI_PROFILE_ANALYSIS: 150000,
  /** xAI Grok API - comprehensive OSINT requires more time for extensive searches */
  OSINT_ANALYSIS: 180000,
  /** OpenRouter image generation - increased for complex prompts */
  IMAGE_GENERATION: 90000,
  /** GetImg.ai Flux - typically faster */
  FLUX_GENERATION: 30000,
} as const;
