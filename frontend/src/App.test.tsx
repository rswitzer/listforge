import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/render';
import App from './App';

describe('App', () => {
  it('renders the main shell with HelloPanel content', async () => {
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

    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /hello, listforge!/i }),
      ).toBeInTheDocument();
    });
  });
});
