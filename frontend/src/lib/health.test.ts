import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkApi, checkDatabase } from './health';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: (url: string) => Promise<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => impl(input.toString())),
  );
}

describe('checkApi', () => {
  it('returns ok when /api/health responds 200', async () => {
    stubFetch(async () => new Response('{"status":"ok"}', { status: 200 }));

    await expect(checkApi()).resolves.toEqual({ status: 'ok' });
  });

  it('returns unreachable with the response body when /api/health responds non-2xx', async () => {
    stubFetch(async () => new Response('Down', { status: 500 }));

    await expect(checkApi()).resolves.toEqual({
      status: 'unreachable',
      detail: 'Down',
    });
  });

  it('returns unreachable with the error message on network failure', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(checkApi()).resolves.toEqual({
      status: 'unreachable',
      detail: 'Failed to fetch',
    });
  });
});

describe('checkDatabase', () => {
  it('hits /api/health/db', async () => {
    const seen: string[] = [];
    stubFetch(async (url) => {
      seen.push(url);
      return new Response('{"status":"ok"}', { status: 200 });
    });

    await checkDatabase();

    expect(seen.some((u) => u.endsWith('/api/health/db'))).toBe(true);
  });

  it('returns unreachable on a 503 with the response body as detail', async () => {
    stubFetch(async () => new Response('Unhealthy', { status: 503 }));

    await expect(checkDatabase()).resolves.toEqual({
      status: 'unreachable',
      detail: 'Unhealthy',
    });
  });

  it('rethrows AbortError so callers can ignore aborted probes', async () => {
    stubFetch(async () => {
      throw new DOMException('aborted', 'AbortError');
    });

    await expect(checkDatabase()).rejects.toThrow('aborted');
  });
});
