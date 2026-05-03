import { test } from '@playwright/test';
import { checkA11y } from './utils/a11y';

// Floor-coverage spec: every top-level route must have zero WCAG 2.1 AA
// violations against axe-core. Per-feature specs may add their own
// `checkA11y(page)` calls after meaningful state changes (e.g. modal open,
// wizard step advance) — this spec is the minimum, not the ceiling.
//
// CONTRIBUTOR NOTE: When you add a new top-level route to the app, add an
// entry here. The check-tdd hook requires a per-page e2e spec, but it does
// NOT enforce floor a11y coverage — that's owned by this list.
const ROUTES: Array<{ name: string; path: string }> = [
  { name: 'landing', path: '/' },
  { name: 'health', path: '/health' },
  { name: 'signup', path: '/signup' },
  { name: 'onboarding-welcome', path: '/onboarding/welcome' },
];

test.describe('accessibility (WCAG 2.1 AA)', () => {
  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) has no axe violations`, async ({ page }) => {
      await page.route('**/api/health', (r) =>
        r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' }),
      );
      await page.route('**/api/health/db', (r) =>
        r.fulfill({ status: 200, contentType: 'text/plain', body: 'Healthy' }),
      );

      await page.goto(route.path);
      await page.getByRole('heading').first().waitFor();

      await checkA11y(page);
    });
  }

  test('signup (/signup) duplicate-email error state has no axe violations', async ({ page }) => {
    await page.route('**/api/auth/register', (r) =>
      r.fulfill({ status: 409, contentType: 'application/json', body: '' }),
    );

    await page.goto('/signup');
    await page.getByLabel(/^email$/i).fill('taken@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/^confirm password$/i).fill('password123');
    await page.getByRole('button', { name: /create account/i }).click();
    await page.getByText(/already registered/i).waitFor();

    await checkA11y(page);
  });
});
