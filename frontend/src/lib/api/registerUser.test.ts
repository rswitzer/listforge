import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerUser } from './registerUser';

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

describe('registerUser', () => {
  it('posts JSON to /api/auth/register and returns the parsed tokens on 201', async () => {
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
        { status: 201, headers: { 'content-type': 'application/json' } },
      );
    });

    const result = await registerUser({ email: 'a@b.co', password: 'password123' });

    expect(seenUrl.endsWith('/api/auth/register')).toBe(true);
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

  it('returns reason="duplicate" on 409', async () => {
    stubFetch(async () => new Response('', { status: 409 }));

    const result = await registerUser({ email: 'taken@b.co', password: 'password123' });

    expect(result).toEqual({ ok: false, reason: 'duplicate' });
  });

  it('returns reason="invalid" with the server-supplied messages on 422', async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ errors: ['Passwords must be at least 8 characters.'] }), {
          status: 422,
          headers: { 'content-type': 'application/json' },
        }),
    );

    const result = await registerUser({ email: 'a@b.co', password: 'short' });

    expect(result).toEqual({
      ok: false,
      reason: 'invalid',
      messages: ['Passwords must be at least 8 characters.'],
    });
  });

  it('returns reason="invalid" with no messages when the 422 body is empty', async () => {
    stubFetch(async () => new Response('', { status: 422 }));

    const result = await registerUser({ email: '', password: '' });

    expect(result).toEqual({ ok: false, reason: 'invalid', messages: [] });
  });

  it('returns reason="network" with the error message on fetch failure', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    const result = await registerUser({ email: 'a@b.co', password: 'password123' });

    expect(result).toEqual({ ok: false, reason: 'network', detail: 'Failed to fetch' });
  });

  it('returns reason="network" on unexpected status codes', async () => {
    stubFetch(async () => new Response('boom', { status: 500 }));

    const result = await registerUser({ email: 'a@b.co', password: 'password123' });

    expect(result).toEqual({ ok: false, reason: 'network', detail: 'HTTP 500' });
  });
});
