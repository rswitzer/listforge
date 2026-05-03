import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@/test/render';
import App from './App';

describe('App', () => {
  it('redirects "/" to /signup so app launch lands on the signup form', async () => {
    render(<App />, { initialEntries: ['/'] });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create your account/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });
});
