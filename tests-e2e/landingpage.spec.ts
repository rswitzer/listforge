import { test, expect } from '@playwright/test';
import { checkA11y } from './utils/a11y';

test('landing page renders hero and how-it-works, CTA navigates to signup', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /better etsy listings/i, level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(/sign up in under a minute/i)).toBeVisible();

  await expect(
    page.getByRole('heading', { name: /how it works/i, level: 2 }),
  ).toBeVisible();
  const steps = page.getByRole('listitem');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toContainText(/upload photos/i);
  await expect(steps.nth(1)).toContainText(/describe it/i);
  await expect(steps.nth(2)).toContainText(/review.*publish/i);

  await checkA11y(page);

  const cta = page.getByRole('link', { name: /create your account/i });
  await expect(cta).toBeVisible();
  await cta.click();

  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByRole('heading', { name: /create your account/i, level: 1 }),
  ).toBeVisible();
  await checkA11y(page);
});

test('header Log in link navigates to /login', async ({ page }) => {
  await page.goto('/');

  const headerLogin = page.getByRole('banner').getByRole('link', { name: /log in/i });
  await expect(headerLogin).toBeVisible();
  await headerLogin.click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('heading', { name: /welcome back/i, level: 1 }),
  ).toBeVisible();
  await checkA11y(page);
});
