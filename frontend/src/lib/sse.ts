export interface SSECallbacks {
  onContentDelta?: (text: string) => void;
  onStageStart?: (stage: string) => void;
  onStageComplete?: (stage: string, data?: unknown) => void;
  onSummaryGenerated?: (summary: string) => void;
  onComplete?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}

function parseSSEFrame(frame: string): { event?: string; data?: string } | null {
  const lines = frame.split('\n');
  let event: string | undefined;
  let data: string | undefined;

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data = line.slice(5).trim();
    }
  }

  if (!event && !data) return null;
  return { event, data };
}

function dispatchSSEEvent(
  eventType: string | undefined,
  data: string | undefined,
  callbacks: SSECallbacks,
): void {
  let parsed: unknown = data;
  if (data) {
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = data;
    }
  }

  switch (eventType) {
    case 'content_delta': {
      const text = typeof parsed === 'object' && parsed !== null && 'text' in parsed
        ? (parsed as { text: string }).text
        : String(parsed);
      callbacks.onContentDelta?.(text);
      break;
    }
    case 'stage_start': {
      const stage = typeof parsed === 'object' && parsed !== null && 'stage' in parsed
        ? (parsed as { stage: string }).stage
        : String(parsed);
      callbacks.onStageStart?.(stage);
      break;
    }
    case 'stage_complete': {
      const obj = parsed as { stage?: string } | undefined;
      const stage = typeof obj === 'object' && obj !== null && 'stage' in obj
        ? obj.stage!
        : 'unknown';
      callbacks.onStageComplete?.(stage, parsed);
      break;
    }
    case 'summary_generated': {
      const summary = typeof parsed === 'object' && parsed !== null && 'summary' in parsed
        ? (parsed as { summary: string }).summary
        : String(parsed);
      callbacks.onSummaryGenerated?.(summary);
      break;
    }
    case 'complete':
      callbacks.onComplete?.(parsed);
      break;
    case 'error':
      callbacks.onError?.(parsed);
      break;
    default:
      break;
  }
}

export async function createSSEStream(
  url: string,
  body: unknown,
  accessToken: string,
  callbacks: SSECallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Stream failed' }));
    callbacks.onError?.(error);
    return;
  }

  if (!res.body) {
    callbacks.onError?.({ message: 'Response body is empty' });
    return;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += value;

      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';

      for (const frame of frames) {
        if (!frame.trim()) continue;
        const parsed = parseSSEFrame(frame);
        if (parsed) {
          dispatchSSEEvent(parsed.event, parsed.data, callbacks);
        }
      }
    }

    if (buffer.trim()) {
      const parsed = parseSSEFrame(buffer);
      if (parsed) {
        dispatchSSEEvent(parsed.event, parsed.data, callbacks);
      }
    }
  } finally {
    reader.releaseLock();
  }
}