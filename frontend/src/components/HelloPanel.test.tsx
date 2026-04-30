import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { render, screen, waitFor } from '@/test/render';
import { HelloPanel } from './HelloPanel';

describe('HelloPanel', () => {
  it('shows a loading state until the request resolves', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})), // never resolves
    );

    render(<HelloPanel />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the message returned by /api/hello', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: 'Hello, ListForge!' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    );

    render(<HelloPanel />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /hello, listforge!/i }),
      ).toBeInTheDocument();
    });
  });

  it('shows an error state when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))),
    );

    render(<HelloPanel />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't reach the server/i)).toBeInTheDocument();
    });
  });

  it('has no axe-detectable accessibility violations in the success state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: 'Hello, ListForge!' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    );

    const { container } = render(<HelloPanel />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /hello, listforge!/i }),
      ).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe-detectable accessibility violations in the error state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))),
    );

    const { container } = render(<HelloPanel />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't reach the server/i)).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
