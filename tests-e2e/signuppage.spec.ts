import { test, expect } from '@playwright/test';
import { checkA11y } from './utils/a11y';

test.describe('Sign up page', () => {
  test('happy path stores tokens and lands on /onboarding/welcome', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'access-test',
          accessTokenExpiresAt: '2030-01-01T00:00:00Z',
          refreshToken: 'refresh-test',
          refreshTokenExpiresAt: '2030-01-14T00:00:00Z',
        }),
      }),
    );

    await page.goto('/signup');
    await page.getByLabel(/^email$/i).fill('first-time@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/^confirm password$/i).fill('password123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/welcome$/);

    const stored = await page.evaluate(() => localStorage.getItem('listforge.auth'));
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).accessToken).toBe('access-test');

    await checkA11y(page);
  });

  test('duplicate email surfaces inline on the email field', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 409, contentType: 'application/json', body: '' }),
    );

    await page.goto('/signup');
    await page.getByLabel(/^email$/i).fill('taken@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/^confirm password$/i).fill('password123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/already registered/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/signup$/);

    await checkA11y(page);
  });

  test('client-side validation rejects mismatched confirmation', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/^email$/i).fill('a@b.co');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/^confirm password$/i).fill('different123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/passwords don't match/i)).toBeVisible();
    await expect(page.getByLabel(/^confirm password$/i)).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/signup$/);

    await checkA11y(page);
  });

  test('network failure renders a friendly form-level alert', async ({ page }) => {
    await page.route('**/api/auth/register', (route) => route.abort('failed'));

    await page.goto('/signup');
    await page.getByLabel(/^email$/i).fill('a@b.co');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/^confirm password$/i).fill('password123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('alert')).toContainText(/couldn't reach the server/i);
    await checkA11y(page);
  });
});
