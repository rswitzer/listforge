import { test, expect } from '@playwright/test';

test('Hello page renders the API-backed greeting', async ({ page }) => {
  await page.route('**/api/hello', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Hello, ListForge!' }),
    }),
  );

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /hello, listforge!/i }),
  ).toBeVisible();

  await expect(
    page.getByText(/listforge backend is wired and serving the api/i),
  ).toBeVisible();
});
