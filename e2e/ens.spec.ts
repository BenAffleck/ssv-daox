import { expect, test } from '@playwright/test';

test('typing an ENS name in the leaderboard search is not overwritten by URL echoes', async ({
  page,
}) => {
  await page.goto('/leaderboard');
  // Slow server renders make the URL echo arrive after the user has typed further.
  await page.route(/[?&]_rsc=/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  const input = page.getByLabel('Search delegates');
  await input.click();
  await input.pressSequentially('vitalik.eth', { delay: 400 });
  await expect(input).toHaveValue('vitalik.eth');
  await page.waitForTimeout(1500);
  await expect(input).toHaveValue('vitalik.eth');
  await expect(page).toHaveURL(/q=vitalik\.eth/, { timeout: 15000 });
  await expect(input).toHaveValue('vitalik.eth');
});

test('delegation page shows the ENS name above the address', async ({ page }) => {
  await page.goto('/delegation?address=vitalik.eth');
  await expect(page).toHaveURL(/address=0x/);
  const profile = page.getByRole('region', { name: 'Delegate profile' });
  await expect(profile.getByText('vitalik.eth', { exact: true }).first()).toBeVisible({
    timeout: 30000,
  });
});
