import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { axe } from '@/test/axe';
import { render, screen, waitFor } from '@/test/render';
import { LoginPage } from './LoginPage';
import * as authModule from '@/lib/auth';

function CurrentPath() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderWithLocation() {
  return render(
    <>
      <LoginPage />
      <CurrentPath />
    </>,
    { initialEntries: ['/login'] },
  );
}

function stubFetch(impl: (url: string, init: RequestInit) => Promise<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
      impl(input.toString(), init ?? {}),
    ),
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('LoginPage', () => {
  it('renders heading, two labeled inputs, and a submit button', () => {
    renderWithLocation();

    expect(
      screen.getByRole('heading', { name: /welcome back/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows per-field errors when submitted empty and focuses email', async () => {
    const { user } = renderWithLocation();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/please enter your email/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toHaveFocus();
  });

  it('rejects malformed email and marks the field aria-invalid', async () => {
    const { user } = renderWithLocation();

    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/doesn't look like a valid email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('on success: stores tokens and navigates to /onboarding/welcome', async () => {
    const setTokensSpy = vi.spyOn(authModule, 'setTokens');
    stubFetch(
      async () =>
        new Response(
          JSON.stringify({
            accessToken: 'a',
            accessTokenExpiresAt: '2030-01-01T00:00:00Z',
            refreshToken: 'r',
            refreshTokenExpiresAt: '2030-01-14T00:00:00Z',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );

    const { user } = renderWithLocation();
    await user.type(screen.getByLabelText(/^email$/i), 'returning@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('current-path')).toHaveTextContent('/onboarding/welcome');
    });
    expect(setTokensSpy).toHaveBeenCalledWith({
      accessToken: 'a',
      accessTokenExpiresAt: '2030-01-01T00:00:00Z',
      refreshToken: 'r',
      refreshTokenExpiresAt: '2030-01-14T00:00:00Z',
    });
  });

  it('on 401: shows the unified didn\'t-match alert, focuses it, and stays on /login', async () => {
    stubFetch(async () => new Response('', { status: 401 }));

    const { user } = renderWithLocation();
    await user.type(screen.getByLabelText(/^email$/i), 'returning@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/that email or password didn't match/i);
    await waitFor(() => expect(alert).toHaveFocus());
    expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
  });

  it('on network failure: shows a form-level alert with friendly copy', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    const { user } = renderWithLocation();
    await user.type(screen.getByLabelText(/^email$/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't reach the server/i);
  });

  it('footer links to /signup for users without an account', () => {
    renderWithLocation();

    const link = screen.getByRole('link', { name: /create one/i });
    expect(link).toHaveAttribute('href', '/signup');
  });

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = renderWithLocation();

    expect(await axe(container)).toHaveNoViolations();
  });
});
