import { devices, expect, test, type Page } from '@playwright/test';

import { DELEGATES_LOAD_TIMEOUT, DELEGATES_TEST_TIMEOUT } from './delegates-load';

// A page wider than the screen makes Chrome on Android zoom out to the
// desktop layout, and RainbowKit then opens its desktop wallet modal.
const { defaultBrowserType: _, ...pixel } = devices['Pixel 7'];

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    screen: document.documentElement.clientWidth,
    layout: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(widths.layout).toBe(widths.screen);
  expect(widths.content).toBe(widths.screen);
}

test.describe('Mobile layout', () => {
  test.describe.configure({ timeout: DELEGATES_TEST_TIMEOUT });
  test.use({ ...pixel, viewport: { width: 360, height: 800 } });

  for (const path of ['/leaderboard', '/delegation']) {
    test(`${path} fits the screen once its table loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('table tbody tr').first()).toBeVisible({
        timeout: DELEGATES_LOAD_TIMEOUT,
      });
      await expectNoHorizontalOverflow(page);
    });
  }

  test('the voting power popover stays on screen', async ({ page }) => {
    await page.goto('/leaderboard');
    await page
      .getByRole('button', { name: 'Show voting power details' })
      .first()
      .click({ timeout: DELEGATES_LOAD_TIMEOUT });
    await expect(page.getByText('Voting Power Breakdown')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('/timeline fits the screen', async ({ page }) => {
    await page.goto('/timeline');
    await expect(page.getByRole('heading', { name: 'Timeline', level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
