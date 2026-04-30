import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { render, screen, waitFor } from '@/test/render';
import App from './App';

function stubHelloFetch() {
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
}

describe('App', () => {
  it('renders the main shell with HelloPanel content', async () => {
    stubHelloFetch();

    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /hello, listforge!/i }),
      ).toBeInTheDocument();
    });
  });

  it('has no axe-detectable accessibility violations once loaded', async () => {
    stubHelloFetch();

    const { container } = render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /hello, listforge!/i }),
      ).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
