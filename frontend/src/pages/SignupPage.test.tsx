import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { axe } from '@/test/axe';
import { render, screen, waitFor } from '@/test/render';
import { SignupPage } from './SignupPage';
import * as authModule from '@/lib/auth';

function CurrentPath() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderWithLocation() {
  return render(
    <>
      <SignupPage />
      <CurrentPath />
    </>,
    { initialEntries: ['/signup'] },
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

describe('SignupPage', () => {
  it('renders heading, three labeled inputs, and a submit button', () => {
    renderWithLocation();

    expect(screen.getByRole('heading', { name: /create your account/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows per-field errors when submitted empty and focuses email', async () => {
    const { user } = renderWithLocation();

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/please enter your email/i)).toBeInTheDocument();
    expect(screen.getByText(/please choose a password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toHaveFocus();
  });

  it('rejects passwords shorter than 8 characters', async () => {
    const { user } = renderWithLocation();

    await user.type(screen.getByLabelText(/^email$/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/use at least 8 characters/i)).toBeInTheDocument();
  });

  it("rejects mismatched confirm password", async () => {
    const { user } = renderWithLocation();

    await user.type(screen.getByLabelText(/^email$/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'different123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toHaveAttribute('aria-invalid', 'true');
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
          { status: 201, headers: { 'content-type': 'application/json' } },
        ),
    );

    const { user } = renderWithLocation();
    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

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

  it('on 409 duplicate: shows friendly per-field message and marks email aria-invalid', async () => {
    stubFetch(async () => new Response('', { status: 409 }));

    const { user } = renderWithLocation();
    await user.type(screen.getByLabelText(/^email$/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/^email$/i)).toHaveFocus();
  });

  it('on 422 invalid: shows a form-level alert with the server message', async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ errors: ['Password is too common.'] }), {
          status: 422,
          headers: { 'content-type': 'application/json' },
        }),
    );

    const { user } = renderWithLocation();
    await user.type(screen.getByLabelText(/^email$/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/password is too common/i);
  });

  it('on network failure: shows a form-level alert with friendly copy', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    const { user } = renderWithLocation();
    await user.type(screen.getByLabelText(/^email$/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't reach the server/i);
  });

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = renderWithLocation();

    expect(await axe(container)).toHaveNoViolations();
  });
});
