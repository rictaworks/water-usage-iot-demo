import { test, expect } from '@playwright/test';

test('dashboard page loads and shows nav links', async ({ page }) => {
  await page.goto('/ja');
  await expect(page.locator('aside')).toBeVisible();
});
