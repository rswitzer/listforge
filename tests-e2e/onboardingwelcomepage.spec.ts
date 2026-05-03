import { test, expect } from '@playwright/test';
import { checkA11y } from './utils/a11y';

test('onboarding welcome stub renders heading and disabled Connect Etsy CTA', async ({ page }) => {
  await page.goto('/onboarding/welcome');

  await expect(page.getByRole('heading', { name: /you're in/i, level: 1 })).toBeVisible();

  const connect = page.getByRole('button', { name: /connect etsy/i });
  await expect(connect).toBeVisible();
  await expect(connect).toBeDisabled();

  await checkA11y(page);
});
