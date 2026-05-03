import type { AuthTokens } from '../auth';

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RegisterResult =
  | { ok: true; tokens: AuthTokens }
  | { ok: false; reason: 'duplicate' }
  | { ok: false; reason: 'invalid'; messages: string[] }
  | { ok: false; reason: 'network'; detail: string };

export async function registerUser(req: RegisterRequest): Promise<RegisterResult> {
  let response: Response;
  try {
    response = await fetch('/api/auth/register', {
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

  if (response.status === 201) {
    const tokens = (await response.json()) as AuthTokens;
    return { ok: true, tokens };
  }
  if (response.status === 409) {
    return { ok: false, reason: 'duplicate' };
  }
  if (response.status === 422) {
    const messages = await readErrorMessages(response);
    return { ok: false, reason: 'invalid', messages };
  }
  return { ok: false, reason: 'network', detail: `HTTP ${response.status}` };
}

async function readErrorMessages(response: Response): Promise<string[]> {
  try {
    const body = (await response.json()) as { errors?: unknown };
    if (Array.isArray(body.errors)) {
      return body.errors.filter((m: unknown): m is string => typeof m === 'string');
    }
    return [];
  } catch {
    return [];
  }
}
