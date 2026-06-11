/**
 * Minimal Server-Sent Events helpers shared by streaming API routes
 * and the browser clients that consume them.
 */

/** Encode a single SSE frame carrying a JSON payload. */
export function encodeSseEvent(event: object): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Read an SSE byte stream and invoke `onData` with each frame's data payload.
 * Resolves when the stream ends. `[DONE]` sentinels are passed through as-is.
 */
export async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onData: (data: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let separatorIndex;
      while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        const data = frame
          .split('\n')
          .map((line) => line.replace(/\r$/, ''))
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');

        if (data) onData(data);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
