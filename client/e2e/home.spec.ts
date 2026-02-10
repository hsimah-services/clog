import { test, expect } from './fixtures';

test.describe('Home Page', () => {
  test('displays welcome heading and seed data counts', async ({ page, waitForData }) => {
    await page.goto('/');
    await waitForData(page);

    await expect(page.getByRole('heading', { name: 'Welcome to Clog' })).toBeVisible();
    await expect(page.getByText('Cave Log - Inventory Management System')).toBeVisible();

    // Verify each card shows the correct count from seed data
    const itemsCard = page.locator('.rounded-xl').filter({ has: page.getByRole('heading', { name: 'Items', exact: true }) });
    await expect(itemsCard.getByText('Total items')).toBeVisible();

    const locationsCard = page.locator('.rounded-xl').filter({ has: page.getByRole('heading', { name: 'Locations' }) });
    await expect(locationsCard.getByText('Total locations')).toBeVisible();

    const inventoryCard = page.locator('.rounded-xl').filter({ has: page.getByRole('heading', { name: 'Inventory' }) });
    await expect(inventoryCard.getByText('Total items in stock')).toBeVisible();
  });

  test('navigates to items page via View All button', async ({ page, waitForData }) => {
    await page.goto('/');
    await waitForData(page);

    await page.locator('a[href="/items"]:has-text("View All")').click();

    await expect(page).toHaveURL('/items');
    await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
  });

  test('navigates to locations page via View All button', async ({ page, waitForData }) => {
    await page.goto('/');
    await waitForData(page);

    await page.locator('a[href="/locations"]:has-text("View All")').click();

    await expect(page).toHaveURL('/locations');
    await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();
  });

  test('navigates to inventory page via View All button', async ({ page, waitForData }) => {
    await page.goto('/');
    await waitForData(page);

    await page.locator('a[href="/inventory"]:has-text("View All")').click();

    await expect(page).toHaveURL('/inventory');
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  });
});
