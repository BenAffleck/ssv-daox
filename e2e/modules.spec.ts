import { test, expect } from '@playwright/test';

test.describe('Module Pages', () => {
  test('active module page displays correctly', async ({ page }) => {
    await page.goto('/dao-delegates');

    // Check heading
    await expect(page.getByRole('heading', { name: 'DAO Delegates' })).toBeVisible();

    // Check placeholder content
    await expect(page.getByText('Module content will be implemented here')).toBeVisible();
  });

  test('coming soon module page displays correctly', async ({ page }) => {
    await page.goto('/governance-proposals');

    // Check heading
    await expect(page.getByRole('heading', { name: 'Governance Proposals' })).toBeVisible();

    // Check coming soon message
    await expect(page.getByText('Coming Soon')).toBeVisible();
    await expect(page.getByText('This module is currently under development')).toBeVisible();
  });

  test('invalid module slug shows not found', async ({ page }) => {
    const response = await page.goto('/non-existent-module');

    // Should get 404 status
    expect(response?.status()).toBe(404);

    // Should show not found message
    await expect(page.getByRole('heading', { name: /Not Found/i })).toBeVisible();
  });

  test('header appears on all module pages', async ({ page }) => {
    await page.goto('/dao-delegates');

    // Header should be visible
    await expect(page.getByRole('link', { name: 'DAOx' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
  });
});
