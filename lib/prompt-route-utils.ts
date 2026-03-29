const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const parseRetryAfter = (retryAfter: string | null): number | null => {
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const targetTime = Date.parse(retryAfter);
  if (Number.isNaN(targetTime)) {
    return null;
  }

  return Math.max(0, targetTime - Date.now());
};

export const shouldRetryPromptRequest = (status: number, hasInlineImage: boolean) => {
  if (!RETRYABLE_STATUS.has(status)) {
    return false;
  }

  if (!hasInlineImage) {
    return true;
  }

  return status === 502 || status === 503 || status === 504;
};

export const getRetryDelayMs = (
  headers: Pick<Headers, 'get'>,
  attempt: number,
  fallbackDelaysMs: readonly number[]
) => {
  const retryAfterDelay = parseRetryAfter(headers.get('retry-after'));
  if (retryAfterDelay !== null) {
    return retryAfterDelay;
  }

  return fallbackDelaysMs[attempt] ?? fallbackDelaysMs[fallbackDelaysMs.length - 1] ?? 0;
};
