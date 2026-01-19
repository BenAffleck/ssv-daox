import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navigates to dao-delegates and back', async ({ page }) => {
    await page.goto('/');

    // Click on DAO Delegates card
    await page.getByRole('link', { name: /DAO Delegates/i }).click();

    // Should navigate to module page
    await expect(page).toHaveURL('/dao-delegates');
    await expect(page.getByRole('heading', { name: 'DAO Delegates' })).toBeVisible();

    // Use header to go back home
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL('/');
  });
});
