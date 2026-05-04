import { describe, expect, it } from 'vitest';
import { within } from '@testing-library/react';
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

  it('exposes login from the page banner and as a secondary link below the CTA', () => {
    render(<LandingPage />);

    const banner = screen.getByRole('banner');
    const headerLogin = within(banner).getByRole('link', { name: /log in/i });
    expect(headerLogin).toHaveAttribute('href', '/login');

    const loginLinks = screen.getAllByRole('link', { name: /log in/i });
    expect(loginLinks).toHaveLength(2);
    expect(loginLinks.every((link) => link.getAttribute('href') === '/login')).toBe(true);
  });

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<LandingPage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
