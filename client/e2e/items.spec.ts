import { test, expect } from './fixtures';

test.describe('Items', () => {
  test('lists seed items', async ({ page, waitForData }) => {
    await page.goto('/items');
    await waitForData(page);

    await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Heinz Ketchup' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dry Dog Food' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Wet Dog Food' })).toBeVisible();
  });

  test('search filters items by name', async ({ page, waitForData }) => {
    await page.goto('/items');
    await waitForData(page);

    await page.getByPlaceholder('Search items...').fill('ketchup');
    await expect(page.getByRole('link', { name: 'Heinz Ketchup' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dry Dog Food' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Wet Dog Food' })).not.toBeVisible();
  });

  test('search shows no results message', async ({ page, waitForData }) => {
    await page.goto('/items');
    await waitForData(page);

    await page.getByPlaceholder('Search items...').fill('nonexistent item xyz');
    await expect(page.getByText('No items found')).toBeVisible();
  });

  test('creates a new item', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    await page.goto('/items/new');
    await waitForData(page);

    await page.getByLabel('Name').fill('Canned Beans');
    await page.getByRole('button', { name: 'Create' }).click();

    // Should redirect to the new item detail page (numeric WordPress ID)
    await expect(page).toHaveURL(/\/items\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Canned Beans' })).toBeVisible();
  });

  test('creates a new item with barcode and default expiry', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    await page.goto('/items/new');
    await waitForData(page);

    await page.getByLabel('Name').fill('Milk');
    await page.getByRole('button', { name: 'Set manually' }).click();
    await page.getByPlaceholder('Enter barcode').first().fill('1234567890');

    // Set default expiry
    await page.getByPlaceholder('e.g. 6').fill('14');
    await page.locator('select').first().selectOption('days');

    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/items\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Milk' })).toBeVisible();
  });

  test('navigates to item detail page', async ({ page, waitForData }) => {
    await page.goto('/items');
    await waitForData(page);

    await page.getByRole('link', { name: 'Heinz Ketchup' }).click();

    await expect(page).toHaveURL(/\/items\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Heinz Ketchup' })).toBeVisible();
  });
});
