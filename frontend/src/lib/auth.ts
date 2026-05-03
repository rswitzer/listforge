export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

// localStorage is acceptable for v1 development — see docs/features/signup.md
// §"Auth state" for the production hardening plan (in-memory access token,
// httpOnly refresh-token cookie).
const STORAGE_KEY = 'listforge.auth';

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function getTokens(): AuthTokens | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated(now: Date = new Date()): boolean {
  const tokens = getTokens();
  if (!tokens) return false;
  return new Date(tokens.accessTokenExpiresAt) > now;
}
