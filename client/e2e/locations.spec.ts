import { test, expect } from './fixtures';

test.describe('Locations', () => {
  test('lists seed locations', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    await page.goto('/locations');
    await waitForData(page);

    await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Garage Shelves' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Garage Freezer' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kitchen Cabinet' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kitchen Freezer' })).toBeVisible();
  });

  test('search filters locations', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    await page.goto('/locations');
    await waitForData(page);

    await page.getByPlaceholder('Search locations...').fill('garage');
    await expect(page.getByRole('link', { name: 'Garage Shelves' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Garage Freezer' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kitchen Cabinet' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Kitchen Freezer' })).not.toBeVisible();
  });

  test('search shows no results message', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    await page.goto('/locations');
    await waitForData(page);

    await page.getByPlaceholder('Search locations...').fill('nonexistent location xyz');
    await expect(page.getByText('No locations found')).toBeVisible();
  });

  test('creates a new location', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    await page.goto('/locations/new');
    await waitForData(page);

    await page.getByLabel('Name').fill('Basement Shelf');
    await page.getByRole('button', { name: 'Create' }).click();

    // Should redirect to the new location detail page (numeric WordPress ID)
    await expect(page).toHaveURL(/\/locations\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Basement Shelf' })).toBeVisible();
  });

  test('navigates to location detail page', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    await page.goto('/locations');
    await waitForData(page);

    await page.getByRole('link', { name: 'Garage Shelves' }).click();

    await expect(page).toHaveURL(/\/locations\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Garage Shelves' })).toBeVisible();
  });
});
