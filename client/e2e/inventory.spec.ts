import { test, expect } from './fixtures';

test.describe('Inventory', () => {
  test('lists seed inventory grouped by item', async ({ page, waitForData }) => {
    await page.goto('/inventory');
    await waitForData(page);

    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Heinz Ketchup' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dry Dog Food' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Wet Dog Food' })).toBeVisible();
  });

  test('search filters inventory', async ({ page, waitForData }) => {
    await page.goto('/inventory');
    await waitForData(page);

    await page.getByPlaceholder('Search inventory...').fill('ketchup');
    await expect(page.getByRole('link', { name: 'Heinz Ketchup' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dry Dog Food' })).not.toBeVisible();
  });

  test('expands item row to show location breakdown', async ({ page, waitForData }) => {
    await page.goto('/inventory');
    await waitForData(page);

    // Click the Heinz Ketchup row to expand it
    const ketchupRow = page.getByRole('row').filter({ hasText: 'Heinz Ketchup' });
    await ketchupRow.click();

    // Should show sub-rows with location names in cells
    await expect(page.locator('tr.bg-muted\\/50').filter({ hasText: 'Kitchen Cabinet' })).toBeVisible();
    await expect(page.locator('tr.bg-muted\\/50').filter({ hasText: 'Garage Shelves' })).toBeVisible();
  });

  test('shows no results message for empty search', async ({ page, waitForData }) => {
    await page.goto('/inventory');
    await waitForData(page);

    await page.getByPlaceholder('Search inventory...').fill('nonexistent xyz');
    await expect(page.getByText('No inventory entries found')).toBeVisible();
  });
});
