import { test } from '@playwright/test';
import { checkA11y } from './utils/a11y';

// Floor-coverage spec: every top-level route must have zero WCAG 2.1 AA
// violations against axe-core. Per-feature specs may add their own
// `checkA11y(page)` calls after meaningful state changes — this spec is
// the minimum, not the ceiling.
const ROUTES: Array<{ name: string; path: string }> = [
  { name: 'health', path: '/health' },
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
});
