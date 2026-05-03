import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { render, screen } from '@/test/render';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renders hero, three steps, and a CTA link to /signup', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /better etsy listings/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/sign up in under a minute/i)).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /how it works/i, level: 2 }),
    ).toBeInTheDocument();

    const steps = screen.getAllByRole('listitem');
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent(/upload photos/i);
    expect(steps[1]).toHaveTextContent(/describe it/i);
    expect(steps[2]).toHaveTextContent(/review.*publish/i);

    const cta = screen.getByRole('link', { name: /create your account/i });
    expect(cta).toHaveAttribute('href', '/signup');
  });

  it('does not show a login link', () => {
    render(<LandingPage />);

    expect(screen.queryByRole('link', { name: /log ?in|sign in/i })).toBeNull();
  });

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<LandingPage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
