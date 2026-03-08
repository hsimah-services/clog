import { test, expect } from './fixtures';

// tests exercising the new bulk/offline mode

test.describe('Bulk/offline mode', () => {
  test('queue persists across reload and syncs correctly', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    // track graphql requests while bulk mode is on
    let graphqlCount = 0;
    await page.route('**/graphql', (route) => {
      graphqlCount++;
      return route.continue();
    });

    // go to bulk page and start bulk mode
    await page.goto('/clog/bulk');
    await page.getByRole('button', { name: 'Start bulk mode' }).click();

    // create a new item and inventory entry while offline
    const itemName = `Offline item ${Date.now()}`;
    await page.goto('/clog/items/new');
    await page.getByLabel('Name').fill(itemName);
    await page.getByRole('button', { name: 'Create' }).click();
    // should navigate to item detail
    await expect(page).toHaveURL(/\/clog\/items\//);

    // add inventory for that new item
    await page.getByRole('button', { name: 'Add Inventory' }).click();
    await page.getByLabel('Item').selectOption({ label: itemName });
    await page.getByLabel('Location').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Create' }).click();

    // no graphql calls should have been made during these operations
    expect(graphqlCount).toBe(0);

    // reload page and verify queued item still visible in items list
    await page.reload();
    await page.goto('/clog/items');
    await waitForData(page);
    await expect(page.getByRole('link', { name: itemName })).toBeVisible();

    // now sync by going back to bulk page
    await page.goto('/clog/bulk');
    await page.getByRole('button', { name: 'Sync queued operations' }).click();
    // after sync, queue should be empty
    await expect(page.getByText('No operations queued.')).toBeVisible();

    // after sync the item should still exist and inventory count update
    await page.goto('/clog/items');
    await waitForData(page);
    await expect(page.getByRole('link', { name: itemName })).toBeVisible();
  });

  test('sync stops on first error and keeps queue', async ({ page, waitForData, authenticate }) => {
    await authenticate();
    // stub server error on second mutation
    let callCount = 0;
    await page.route('**/graphql', (route) => {
      callCount++;
      if (callCount === 2) {
        route.fulfill({ status: 500, body: 'server error' });
      } else {
        route.continue();
      }
    });

    await page.goto('/clog/bulk');
    await page.getByRole('button', { name: 'Start bulk mode' }).click();

    // queue two items
    await page.goto('/clog/items/new');
    await page.getByLabel('Name').fill('Err1');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.goto('/clog/items/new');
    await page.getByLabel('Name').fill('Err2');
    await page.getByRole('button', { name: 'Create' }).click();

    // go to bulk page and sync
    await page.goto('/clog/bulk');
    await page.getByRole('button', { name: 'Sync queued operations' }).click();
    await expect(page.getByText(/Sync failed/)).toBeVisible();

    // queue should still contain at least one operation (the failing one or later)
    await expect(page.getByRole('listitem')).not.toHaveCount(0);
  });
});