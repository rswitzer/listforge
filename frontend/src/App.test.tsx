import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@/test/render';
import App from './App';

describe('App', () => {
  it('redirects "/" to /health so the health dashboard is the default landing surface', async () => {
    render(<App />, { initialEntries: ['/'] });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /system health/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('renders the health page directly at /health', async () => {
    render(<App />, { initialEntries: ['/health'] });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /system health/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });
});
