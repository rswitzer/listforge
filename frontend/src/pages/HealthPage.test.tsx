import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { render, screen, waitFor, within } from '@/test/render';
import { HealthPage } from './HealthPage';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: (url: string) => Promise<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => impl(input.toString())),
  );
}

function getCard(label: 'API' | 'Database') {
  const heading = screen.getByRole('heading', { name: new RegExp(`^${label}$`, 'i'), level: 2 });
  const card = heading.closest('li');
  if (!card) throw new Error(`Card for ${label} not found`);
  return card as HTMLElement;
}

describe('HealthPage', () => {
  it('renders the heading and a card for each probe', async () => {
    stubFetch(async () => new Response('OK', { status: 200 }));

    render(<HealthPage />);

    expect(screen.getByRole('heading', { name: /system health/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^api$/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^database$/i, level: 2 })).toBeInTheDocument();
  });

  it('shows Connected on both cards when both probes return 200', async () => {
    stubFetch(async () => new Response('OK', { status: 200 }));

    render(<HealthPage />);

    await waitFor(() => {
      expect(within(getCard('API')).getByText(/connected/i)).toBeInTheDocument();
      expect(within(getCard('Database')).getByText(/connected/i)).toBeInTheDocument();
    });
  });

  it('shows Unreachable on the Database card when /api/health/db responds 503', async () => {
    stubFetch(async (url) => {
      if (url.endsWith('/api/health/db')) {
        return new Response('Unhealthy', { status: 503 });
      }
      return new Response('OK', { status: 200 });
    });

    render(<HealthPage />);

    await waitFor(() => {
      expect(within(getCard('API')).getByText(/connected/i)).toBeInTheDocument();
      expect(within(getCard('Database')).getByText(/unreachable/i)).toBeInTheDocument();
    });
  });

  it('exposes the failure detail under a More info disclosure when a probe is unreachable', async () => {
    stubFetch(async () => new Response('Connection refused', { status: 503 }));

    render(<HealthPage />);

    await waitFor(() => {
      expect(within(getCard('Database')).getByText(/unreachable/i)).toBeInTheDocument();
    });

    const dbCard = getCard('Database');
    expect(within(dbCard).getByText('More info')).toBeInTheDocument();
    expect(within(dbCard).getByText(/connection refused/i)).toBeInTheDocument();
  });

  it('refresh button re-runs both probes', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('OK', { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);

    const { user } = render(<HealthPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await user.click(screen.getByRole('button', { name: /check again/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  });

  it('has no axe-detectable accessibility violations once loaded', async () => {
    stubFetch(async () => new Response('OK', { status: 200 }));

    const { container } = render(<HealthPage />);

    await waitFor(() => {
      expect(within(getCard('API')).getByText(/connected/i)).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
