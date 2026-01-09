import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads successfully and displays content', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/DAOx/);

    // Check header
    await expect(page.getByRole('heading', { name: 'DAOx', level: 1 })).toBeVisible();
    await expect(page.getByText('Modular hub for SSV Network DAO members')).toBeVisible();
  });

  test('displays correct number of module cards', async ({ page }) => {
    await page.goto('/');

    // Should have at least 2 modules (DAO Delegates and one Coming Soon)
    const cards = page.locator('.grid > *');
    await expect(cards).toHaveCount(2);
  });

  test('displays active module with correct styling', async ({ page }) => {
    await page.goto('/');

    const daoCard = page.getByRole('link', { name: /DAO Delegates/i });
    await expect(daoCard).toBeVisible();
    await expect(daoCard).toHaveAttribute('href', '/dao-delegates');
  });

  test('displays coming soon module with badge', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Governance Proposals')).toBeVisible();
    await expect(page.getByText('Coming Soon')).toBeVisible();
  });

  test('header navigation links work', async ({ page }) => {
    await page.goto('/');

    // Click header logo
    await page.getByRole('link', { name: 'DAOx' }).first().click();
    await expect(page).toHaveURL('/');
  });
});
