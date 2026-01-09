import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navigates to active module page', async ({ page }) => {
    await page.goto('/');

    // Click on DAO Delegates card
    await page.getByRole('link', { name: /DAO Delegates/i }).click();

    // Should navigate to module page
    await expect(page).toHaveURL('/dao-delegates');
    await expect(page.getByRole('heading', { name: 'DAO Delegates' })).toBeVisible();
  });

  test('header home link returns to landing page', async ({ page }) => {
    // Start on a module page
    await page.goto('/dao-delegates');

    // Click home link in nav
    await page.getByRole('link', { name: 'Home' }).click();

    // Should return to home
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'DAOx', level: 1 })).toBeVisible();
  });

  test('header logo returns to landing page', async ({ page }) => {
    // Start on a module page
    await page.goto('/dao-delegates');

    // Click logo
    await page.getByRole('link', { name: 'DAOx' }).first().click();

    // Should return to home
    await expect(page).toHaveURL('/');
  });

  test('browser back button works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /DAO Delegates/i }).click();
    await expect(page).toHaveURL('/dao-delegates');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/');
  });
});
