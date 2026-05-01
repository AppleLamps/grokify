const SENSITIVE_KEY_PATTERN = /(api[-_]?key|authorization|token|secret|password|prompt|image|video|dataurl|body|content|messages)/i;

const REDACTION_PATTERNS: Array<[RegExp, string]> = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]'],
  [/\b(?:xai|sk-or)-[A-Za-z0-9_-]+/g, '[redacted-key]'],
  [/data:(?:image|video)\/[A-Za-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+/g, '[redacted-data-url]'],
  [/https:\/\/[^"'\s]+\.blob\.vercel-storage\.com\/[^"'\s]+/g, '[redacted-blob-url]'],
];

export function redactForLog(value: unknown, key = ''): unknown {
  if (typeof value === 'string') {
    if (SENSITIVE_KEY_PATTERN.test(key)) return '[redacted]';
    return REDACTION_PATTERNS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value);
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactForLog(value.message),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item, key));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        SENSITIVE_KEY_PATTERN.test(entryKey) ? '[redacted]' : redactForLog(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

export const serverLogger = {
  info(message: string, meta?: unknown): void {
    if (meta === undefined) {
      console.log(message);
      return;
    }
    console.log(message, redactForLog(meta));
  },
  warn(message: string, meta?: unknown): void {
    if (meta === undefined) {
      console.warn(message);
      return;
    }
    console.warn(message, redactForLog(meta));
  },
  error(message: string, meta?: unknown): void {
    if (meta === undefined) {
      console.error(message);
      return;
    }
    console.error(message, redactForLog(meta));
  },
};

export function canLogAiPayloads(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DEBUG_AI_PAYLOADS === 'true';
}
