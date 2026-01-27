import { test, expect } from '@playwright/test';

test.describe('Vote Participation', () => {
  test('displays vote participation column in delegates table', async ({
    page,
  }) => {
    // Navigate to dao-delegates page
    await page.goto('/dao-delegates');

    // Wait for the table to load
    await expect(
      page.getByRole('heading', { name: 'DAO Delegates' })
    ).toBeVisible();

    // Assert "Votes" column header is visible
    await expect(
      page.getByRole('columnheader', { name: 'Voting Participation' })
    ).toBeVisible();

    // Assert at least one percentage badge is visible (matches /^\d{1,3}%$/)
    const percentageBadges = page.locator('td span:text-matches("^\\\\d{1,3}%$")');
    await expect(percentageBadges.first()).toBeVisible();
  });

  test('percentage badge has correct tooltip', async ({ page }) => {
    await page.goto('/dao-delegates');

    // Wait for the table to load
    await expect(
      page.getByRole('heading', { name: 'DAO Delegates' })
    ).toBeVisible();

    // Find a percentage badge and check its title attribute
    const percentageBadge = page.locator('td span[title*="Voted on"]').first();
    await expect(percentageBadge).toBeVisible();

    const title = await percentageBadge.getAttribute('title');
    expect(title).toMatch(/Voted on \d{1,3}% of the 5 most recent proposals/);
  });
});
