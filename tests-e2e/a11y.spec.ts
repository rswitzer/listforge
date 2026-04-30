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
  { name: 'home', path: '/' },
];

test.describe('accessibility (WCAG 2.1 AA)', () => {
  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) has no axe violations`, async ({ page }) => {
      await page.route('**/api/hello', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Hello, ListForge!' }),
        }),
      );

      await page.goto(route.path);
      await page.getByRole('heading').first().waitFor();

      await checkA11y(page);
    });
  }

  // The error state surfaces text in `terracotta` on `sand`. Contrast lives or
  // dies here, so the error path gets its own scan independent of the route loop.
  test('home (/) error state has no axe violations', async ({ page }) => {
    await page.route('**/api/hello', (r) => r.fulfill({ status: 500, body: '' }));

    await page.goto('/');
    await page.getByText(/couldn't reach the server/i).waitFor();

    await checkA11y(page);
  });
});
