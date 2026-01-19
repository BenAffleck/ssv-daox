import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads and displays modules', async ({ page }) => {
    await page.goto('/');

    // Check page title and main heading
    await expect(page).toHaveTitle(/DAOx/);
    await expect(page.getByRole('heading', { name: 'DAOx', level: 1 })).toBeVisible();

    // Check that modules are displayed
    await expect(page.getByText('DAO Delegates')).toBeVisible();
    await expect(page.getByText('Governance Proposals')).toBeVisible();
  });
});
