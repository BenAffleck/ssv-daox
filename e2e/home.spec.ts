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

  test('displays Featured DAO Community section', async ({ page }) => {
    await page.goto('/');

    // Check section heading
    await expect(
      page.getByRole('heading', { name: 'Featured DAO Community', level: 2 })
    ).toBeVisible();
    await expect(page.getByText('Tools built by the SSV community')).toBeVisible();

    // Check Stake Easy card is displayed
    await expect(page.getByText('Stake Easy')).toBeVisible();
    await expect(
      page.getByText('Simplified staking experience for SSV Network')
    ).toBeVisible();

    // Check Community badge (the small badge inside the card)
    const communityBadge = page.locator('span', { hasText: 'Community' });
    await expect(communityBadge).toBeVisible();
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
