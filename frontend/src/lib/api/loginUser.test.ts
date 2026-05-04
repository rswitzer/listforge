import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginUser } from './loginUser';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: (url: string, init: RequestInit) => Promise<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
      impl(input.toString(), init ?? {}),
    ),
  );
}

describe('loginUser', () => {
  it('posts JSON to /api/auth/login and returns the parsed tokens on 200', async () => {
    let seenUrl = '';
    let seenBody = '';
    stubFetch(async (url, init) => {
      seenUrl = url;
      seenBody = String(init.body);
      return new Response(
        JSON.stringify({
          accessToken: 'a',
          accessTokenExpiresAt: '2030-01-01T00:00:00Z',
          refreshToken: 'r',
          refreshTokenExpiresAt: '2030-01-14T00:00:00Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });

    const result = await loginUser({ email: 'a@b.co', password: 'password123' });

    expect(seenUrl.endsWith('/api/auth/login')).toBe(true);
    expect(JSON.parse(seenBody)).toEqual({ email: 'a@b.co', password: 'password123' });
    expect(result).toEqual({
      ok: true,
      tokens: {
        accessToken: 'a',
        accessTokenExpiresAt: '2030-01-01T00:00:00Z',
        refreshToken: 'r',
        refreshTokenExpiresAt: '2030-01-14T00:00:00Z',
      },
    });
  });

  it('returns reason="invalid" on 401 (unknown email or wrong password)', async () => {
    stubFetch(async () => new Response('', { status: 401 }));

    const result = await loginUser({ email: 'a@b.co', password: 'nope' });

    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('returns reason="network" with the error message on fetch failure', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    const result = await loginUser({ email: 'a@b.co', password: 'password123' });

    expect(result).toEqual({ ok: false, reason: 'network', detail: 'Failed to fetch' });
  });

  it('returns reason="network" on unexpected status codes', async () => {
    stubFetch(async () => new Response('boom', { status: 500 }));

    const result = await loginUser({ email: 'a@b.co', password: 'password123' });

    expect(result).toEqual({ ok: false, reason: 'network', detail: 'HTTP 500' });
  });
});
