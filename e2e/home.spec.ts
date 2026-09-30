import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads and displays modules', async ({ page }) => {
    await page.goto('/');

    // Check page title and main heading
    await expect(page).toHaveTitle(/DAOx/);
    await expect(page.getByRole('heading', { name: 'DAOx', level: 1 })).toBeVisible();

    // Check that modules are displayed
    await expect(page.getByRole('heading', { name: 'DAO Delegates' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Governance Votes' })).toBeVisible();
  });

  test('displays the External Tools section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'External Tools', level: 2 })).toBeVisible();

    // Stake Easy is a featured tool
    const stakeEasy = page.getByRole('link', { name: /Stake Easy/ });
    await expect(stakeEasy.getByRole('heading', { name: 'Stake Easy' })).toBeVisible();
    await expect(stakeEasy.getByText('Featured')).toBeVisible();
  });

  test('community tool link opens in new tab', async ({ page }) => {
    await page.goto('/');

    // Find the Stake Easy link and verify attributes
    const stakeeasyLink = page.getByRole('link', { name: /Stake Easy/ });
    await expect(stakeeasyLink).toHaveAttribute('href', 'https://stakeeasy.xyz');
    await expect(stakeeasyLink).toHaveAttribute('target', '_blank');
    await expect(stakeeasyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
