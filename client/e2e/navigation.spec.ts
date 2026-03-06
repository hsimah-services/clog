import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('header navigation links work correctly', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    await page.goto('/clog');
    await waitForData(page);

    // Navigate to Items
    await page.getByRole('navigation').getByRole('link', { name: 'Items' }).click();
    await expect(page).toHaveURL('/clog/items');

    // Navigate to Locations
    await page.getByRole('navigation').getByRole('link', { name: 'Locations' }).click();
    await expect(page).toHaveURL('/clog/locations');

    // Navigate to Inventory
    await page.getByRole('navigation').getByRole('link', { name: 'Inventory' }).click();
    await expect(page).toHaveURL('/clog/inventory');

    // Navigate Home via logo
    await page.getByRole('link', { name: 'Clog' }).click();
    await expect(page).toHaveURL('/clog');
  });
});
