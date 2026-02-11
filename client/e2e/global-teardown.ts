import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEED_ITEM_NAMES, SEED_LOCATION_NAMES } from './seed-data';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const GRAPHQL_URL = process.env.VITE_GRAPHQL_URL || 'http://localhost:8080/graphql';

async function graphql(query: string, variables: Record<string, unknown>, token: string) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function authenticate(): Promise<string> {
  const username = process.env.WP_ADMIN_USER;
  const password = process.env.WP_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('WP_ADMIN_USER and WP_ADMIN_PASSWORD must be set in .env');
  }

  const body = await graphql(
    `mutation Login($username: String!, $password: String!) {
      login(input: { username: $username, password: $password }) {
        authToken
      }
    }`,
    { username, password },
    '',
  );

  const token = body.data?.login?.authToken;
  if (!token) {
    throw new Error(`Login failed: ${JSON.stringify(body.errors ?? body)}`);
  }
  return token;
}

interface ClogNode {
  databaseId: number;
  title: string;
}

interface InventoryNode {
  databaseId: number;
  item: { title: string } | null;
  location: { title: string } | null;
}

async function globalTeardown() {
  let token: string;
  try {
    token = await authenticate();
  } catch (e) {
    console.log(`[teardown] Skipping cleanup: ${(e as Error).message}`);
    return;
  }

  // Fetch all data
  const [itemsRes, locationsRes, inventoryRes] = await Promise.all([
    graphql(`query { clogItems(first: 100) { nodes { databaseId title } } }`, {}, token),
    graphql(`query { clogLocations(first: 100) { nodes { databaseId title } } }`, {}, token),
    graphql(
      `query { clogInventoryEntries(first: 100) { nodes { databaseId item { title } location { title } } } }`,
      {},
      token,
    ),
  ]);

  const allItems: ClogNode[] = itemsRes.data?.clogItems?.nodes ?? [];
  const allLocations: ClogNode[] = locationsRes.data?.clogLocations?.nodes ?? [];
  const allInventory: InventoryNode[] = inventoryRes.data?.clogInventoryEntries?.nodes ?? [];

  const testItems = allItems.filter((i) => !SEED_ITEM_NAMES.includes(i.title));
  const testLocations = allLocations.filter((l) => !SEED_LOCATION_NAMES.includes(l.title));

  // Inventory entries that reference non-seed items or locations
  const testInventory = allInventory.filter(
    (inv) =>
      (inv.item && !SEED_ITEM_NAMES.includes(inv.item.title)) ||
      (inv.location && !SEED_LOCATION_NAMES.includes(inv.location.title)),
  );

  if (testInventory.length === 0 && testItems.length === 0 && testLocations.length === 0) {
    console.log('[teardown] No test data to clean up');
    return;
  }

  // Delete in order: inventory -> items -> locations
  for (const inv of testInventory) {
    try {
      await graphql(
        `mutation DeleteInventory($input: DeleteClogInventoryInput!) {
          deleteClogInventory(input: $input) { deletedId }
        }`,
        { input: { id: String(inv.databaseId) } },
        token,
      );
      console.log(`[teardown] Deleted inventory entry ${inv.databaseId}`);
    } catch (e) {
      console.log(`[teardown] Failed to delete inventory ${inv.databaseId}: ${(e as Error).message}`);
    }
  }

  for (const item of testItems) {
    try {
      await graphql(
        `mutation DeleteItem($input: DeleteClogItemInput!) {
          deleteClogItem(input: $input) { deletedId }
        }`,
        { input: { id: String(item.databaseId) } },
        token,
      );
      console.log(`[teardown] Deleted item "${item.title}"`);
    } catch (e) {
      console.log(`[teardown] Failed to delete item "${item.title}": ${(e as Error).message}`);
    }
  }

  for (const loc of testLocations) {
    try {
      await graphql(
        `mutation DeleteLocation($input: DeleteClogLocationInput!) {
          deleteClogLocation(input: $input) { deletedId }
        }`,
        { input: { id: String(loc.databaseId) } },
        token,
      );
      console.log(`[teardown] Deleted location "${loc.title}"`);
    } catch (e) {
      console.log(`[teardown] Failed to delete location "${loc.title}": ${(e as Error).message}`);
    }
  }

  console.log(
    `[teardown] Cleanup complete: ${testInventory.length} inventory, ${testItems.length} items, ${testLocations.length} locations deleted`,
  );
}

export default globalTeardown;
