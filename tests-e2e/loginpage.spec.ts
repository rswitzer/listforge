import { test, expect } from '@playwright/test';
import { checkA11y } from './utils/a11y';

test.describe('Login page', () => {
  test('happy path stores tokens and lands on /onboarding/welcome', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'access-test',
          accessTokenExpiresAt: '2030-01-01T00:00:00Z',
          refreshToken: 'refresh-test',
          refreshTokenExpiresAt: '2030-01-14T00:00:00Z',
        }),
      }),
    );

    await page.goto('/login');
    await page.getByLabel(/^email$/i).fill('returning@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/welcome$/);

    const stored = await page.evaluate(() => localStorage.getItem('listforge.auth'));
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).accessToken).toBe('access-test');

    await checkA11y(page);
  });

  test('wrong credentials surface a unified form-level alert', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '' }),
    );

    await page.goto('/login');
    await page.getByLabel(/^email$/i).fill('returning@example.com');
    await page.getByLabel(/^password$/i).fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toContainText(
      /that email or password didn't match/i,
    );
    await expect(page).toHaveURL(/\/login$/);

    await checkA11y(page);
  });

  test('client-side validation rejects an empty email', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/please enter your email/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await checkA11y(page);
  });

  test('network failure renders a friendly form-level alert', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => route.abort('failed'));

    await page.goto('/login');
    await page.getByLabel(/^email$/i).fill('a@b.co');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toContainText(/couldn't reach the server/i);
    await checkA11y(page);
  });
});
