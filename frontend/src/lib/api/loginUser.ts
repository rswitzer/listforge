import type { AuthTokens } from '../auth';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResult =
  | { ok: true; tokens: AuthTokens }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'network'; detail: string };

export async function loginUser(req: LoginRequest): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch (error) {
    return {
      ok: false,
      reason: 'network',
      detail: error instanceof Error ? error.message : 'Request failed',
    };
  }

  if (response.status === 200) {
    const tokens = (await response.json()) as AuthTokens;
    return { ok: true, tokens };
  }
  if (response.status === 401) {
    return { ok: false, reason: 'invalid' };
  }
  return { ok: false, reason: 'network', detail: `HTTP ${response.status}` };
}
