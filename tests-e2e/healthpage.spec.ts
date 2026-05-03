import { test, expect } from '@playwright/test';
import { checkA11y } from './utils/a11y';

test.describe('System Health page', () => {
  test('renders the heading and one card per probe', async ({ page }) => {
    await page.route('**/api/health', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' }),
    );
    await page.route('**/api/health/db', (r) =>
      r.fulfill({ status: 200, contentType: 'text/plain', body: 'Healthy' }),
    );

    await page.goto('/health');

    await expect(page.getByRole('heading', { name: /system health/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^api$/i, level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^database$/i, level: 2 })).toBeVisible();

    const apiCard = page.getByRole('heading', { name: /^api$/i, level: 2 }).locator('..');
    const dbCard = page.getByRole('heading', { name: /^database$/i, level: 2 }).locator('..');
    await expect(apiCard).toContainText(/connected/i);
    await expect(dbCard).toContainText(/connected/i);

    await checkA11y(page);
  });

  test('shows Unreachable on the Database card when /api/health/db returns 503', async ({ page }) => {
    await page.route('**/api/health', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' }),
    );
    await page.route('**/api/health/db', (r) =>
      r.fulfill({ status: 503, contentType: 'text/plain', body: 'Unhealthy' }),
    );

    await page.goto('/health');

    const dbCard = page.getByRole('heading', { name: /^database$/i, level: 2 }).locator('..');
    await expect(dbCard).toContainText(/unreachable/i);
    await dbCard.getByText(/more info/i).click();
    await expect(dbCard).toContainText(/unhealthy/i);

    await checkA11y(page);
  });

  test('refresh button re-runs both probes', async ({ page }) => {
    let apiCalls = 0;
    let dbCalls = 0;
    await page.route('**/api/health', (r) => {
      apiCalls += 1;
      return r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' });
    });
    await page.route('**/api/health/db', (r) => {
      dbCalls += 1;
      return r.fulfill({ status: 200, contentType: 'text/plain', body: 'Healthy' });
    });

    await page.goto('/health');
    const apiCard = page.getByRole('heading', { name: /^api$/i, level: 2 }).locator('..');
    await expect(apiCard).toContainText(/connected/i);

    expect(apiCalls).toBeGreaterThan(0);
    expect(dbCalls).toBeGreaterThan(0);
    const apiBefore = apiCalls;
    const dbBefore = dbCalls;

    await page.getByRole('button', { name: /check again/i }).click();
    await expect.poll(() => apiCalls).toBeGreaterThan(apiBefore);
    await expect.poll(() => dbCalls).toBeGreaterThan(dbBefore);
  });
});
