import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { render, screen } from '@/test/render';
import { OnboardingWelcomePage } from './OnboardingWelcomePage';

describe('OnboardingWelcomePage', () => {
  it('renders heading, body, and a disabled Connect Etsy CTA', () => {
    render(<OnboardingWelcomePage />);

    expect(screen.getByRole('heading', { name: /you're in/i, level: 1 })).toBeInTheDocument();
    const connect = screen.getByRole('button', { name: /connect etsy/i });
    expect(connect).toBeDisabled();
    expect(connect).toHaveAccessibleDescription(/coming soon/i);
  });

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<OnboardingWelcomePage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
