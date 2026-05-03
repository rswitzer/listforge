export type HealthResult =
  | { status: 'ok' }
  | { status: 'unreachable'; detail: string };

async function probe(url: string, signal?: AbortSignal): Promise<HealthResult> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return { status: 'unreachable', detail: body || `HTTP ${response.status}` };
    }
    return { status: 'ok' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    const detail = error instanceof Error ? error.message : 'Network error';
    return { status: 'unreachable', detail };
  }
}

export const checkApi = (signal?: AbortSignal) => probe('/api/health', signal);
export const checkDatabase = (signal?: AbortSignal) => probe('/api/health/db', signal);
