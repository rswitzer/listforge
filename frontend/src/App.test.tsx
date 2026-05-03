import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@/test/render';
import App from './App';

describe('App', () => {
  it('renders the landing page at "/" so unauthenticated visitors see what ListForge is before signing up', async () => {
    render(<App />, { initialEntries: ['/'] });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /better etsy listings/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('still serves the signup form directly at /signup', async () => {
    render(<App />, { initialEntries: ['/signup'] });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create your account/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });
});
