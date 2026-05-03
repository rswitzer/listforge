import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearTokens,
  getTokens,
  isAuthenticated,
  setTokens,
  type AuthTokens,
} from './auth';

const STORAGE_KEY = 'listforge.auth';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

function makeTokens(overrides: Partial<AuthTokens> = {}): AuthTokens {
  return {
    accessToken: 'access-token-value',
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    refreshToken: 'refresh-token-value',
    refreshTokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe('setTokens / getTokens', () => {
  it('round-trips an authentic shape', () => {
    const tokens = makeTokens();

    setTokens(tokens);

    expect(getTokens()).toEqual(tokens);
  });

  it('returns null when no tokens have been stored', () => {
    expect(getTokens()).toBeNull();
  });

  it('returns null when storage is corrupt rather than throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');

    expect(getTokens()).toBeNull();
  });
});

describe('clearTokens', () => {
  it('removes the stored tokens', () => {
    setTokens(makeTokens());

    clearTokens();

    expect(getTokens()).toBeNull();
  });

  it('is a no-op when nothing is stored', () => {
    expect(() => clearTokens()).not.toThrow();
  });
});

describe('isAuthenticated', () => {
  it('returns false when no tokens are stored', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('returns true when the access token is unexpired', () => {
    setTokens(makeTokens());

    expect(isAuthenticated()).toBe(true);
  });

  it('returns false when the access token has expired', () => {
    setTokens(makeTokens({ accessTokenExpiresAt: new Date(Date.now() - 1000).toISOString() }));

    expect(isAuthenticated()).toBe(false);
  });
});
