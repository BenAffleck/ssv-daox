import { expect, test } from '@playwright/test';

import { DELEGATES_LOAD_TIMEOUT, DELEGATES_TEST_TIMEOUT } from './delegates-load';

test.describe('Navigation', () => {
  test.describe.configure({ timeout: DELEGATES_TEST_TIMEOUT });

  test('navigates to dao-delegates and back', async ({ page }) => {
    await page.goto('/');

    // Click on DAO Delegates card
    await page
      .getByRole('main')
      .getByRole('link', { name: /DAO Delegates/i })
      .click();

    // Should navigate to module page
    await expect(page).toHaveURL('/delegates');
    await expect(page.getByRole('heading', { name: 'DAO Delegates' })).toBeVisible({
      timeout: DELEGATES_LOAD_TIMEOUT,
    });

    // Use header to go back home
    await page.getByRole('link', { name: 'DAOx' }).click();
    await expect(page).toHaveURL('/');
  });
});
