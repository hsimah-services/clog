import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ITEMS, GET_LOCATIONS, GET_INVENTORY } from '@/graphql/queries';
import {
  CREATE_ITEM, UPDATE_ITEM, DELETE_ITEM,
  CREATE_LOCATION, UPDATE_LOCATION, DELETE_LOCATION,
  CREATE_INVENTORY, UPDATE_INVENTORY, DELETE_INVENTORY,
} from '@/graphql/mutations';
import type { Item, Location, Inventory, BulkOp, BulkQueue } from '@/types';

interface DataContextType {
  // effective (server + pending) data
  items: Item[];
  locations: Location[];
  inventory: Inventory[];
  // CRUD methods
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => Promise<Item>;
  updateItem: (id: string, item: Partial<Omit<Item, 'id' | 'createdAt'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItem: (id: string) => Item | undefined;
  addLocation: (location: Omit<Location, 'id' | 'createdAt'>) => Promise<Location>;
  updateLocation: (id: string, location: Partial<Omit<Location, 'id' | 'createdAt'>>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  getLocation: (id: string) => Location | undefined;
  addInventory: (inventory: Omit<Inventory, 'id' | 'createdAt'>) => Promise<Inventory>;
  updateInventory: (id: string, inventory: Partial<Omit<Inventory, 'id' | 'createdAt'>>) => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;
  getInventory: (id: string) => Inventory | undefined;

  // bulk/offline mode
  isBulkMode: boolean;
  bulkQueue: BulkQueue;
  enterBulkMode: () => void;
  exitBulkMode: () => void;
  addToQueue: (op: BulkOp) => void;
  syncBulkQueue: () => Promise<{ success: boolean; error?: Error }>;

  loading: boolean;
  error: Error | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface GraphQLItem {
  databaseId: number;
  title: string;
  date: string;
  barcodes: string[] | null;
  defaultExpiry: { unit: string; value: number } | null;
}

interface GraphQLLocation {
  databaseId: number;
  title: string;
  date: string;
}

interface GraphQLInventory {
  databaseId: number;
  date: string;
  dateAdded: string | null;
  dateExpiry: string | null;
  item: GraphQLItem | null;
  location: GraphQLLocation | null;
}

interface ItemsQueryData {
  clogItems: { nodes: GraphQLItem[] };
}

interface LocationsQueryData {
  clogLocations: { nodes: GraphQLLocation[] };
}

interface InventoryQueryData {
  clogInventoryEntries: { nodes: GraphQLInventory[] };
}

interface CreateItemData {
  createClogItem: { clogItem: GraphQLItem };
}

interface CreateLocationData {
  createClogLocation: { clogLocation: GraphQLLocation };
}

interface CreateInventoryData {
  createClogInventory: { clogInventory: GraphQLInventory };
}

function transformItem(gqlItem: GraphQLItem): Item {
  return {
    id: String(gqlItem.databaseId),
    name: gqlItem.title,
    barcodes: gqlItem.barcodes ?? [],
    defaultExpiry: gqlItem.defaultExpiry
      ? { unit: gqlItem.defaultExpiry.unit.toLowerCase() as 'days' | 'months', value: gqlItem.defaultExpiry.value }
      : null,
    createdAt: new Date(gqlItem.date),
  };
}

function transformLocation(gqlLocation: GraphQLLocation): Location {
  return {
    id: String(gqlLocation.databaseId),
    name: gqlLocation.title,
    createdAt: new Date(gqlLocation.date),
  };
}

function transformInventory(gqlInventory: GraphQLInventory): Inventory {
  return {
    id: String(gqlInventory.databaseId),
    itemId: gqlInventory.item ? String(gqlInventory.item.databaseId) : '',
    locationId: gqlInventory.location ? String(gqlInventory.location.databaseId) : '',
    dateAdded: gqlInventory.dateAdded ? new Date(gqlInventory.dateAdded) : new Date(gqlInventory.date),
    dateExpiry: gqlInventory.dateExpiry ? new Date(gqlInventory.dateExpiry) : null,
    createdAt: new Date(gqlInventory.date),
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { data: itemsData, loading: itemsLoading, error: itemsError } = useQuery<ItemsQueryData>(GET_ITEMS);
  const { data: locationsData, loading: locationsLoading, error: locationsError } = useQuery<LocationsQueryData>(GET_LOCATIONS);
  const { data: inventoryData, loading: inventoryLoading, error: inventoryError } = useQuery<InventoryQueryData>(GET_INVENTORY);

  // bulk mode state and persistence
  const QUEUE_KEY = 'clog_bulk_queue';
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<BulkQueue>([]);

  // load queue from storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) {
        setBulkQueue(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  // persist queue when it changes
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(bulkQueue));
    } catch {
      // ignore
    }
  }, [bulkQueue]);

  const [createItemMutation] = useMutation<CreateItemData>(CREATE_ITEM, { refetchQueries: [{ query: GET_ITEMS }] });
  const [updateItemMutation] = useMutation(UPDATE_ITEM, { refetchQueries: [{ query: GET_ITEMS }] });
  const [deleteItemMutation] = useMutation(DELETE_ITEM, { refetchQueries: [{ query: GET_ITEMS }, { query: GET_INVENTORY }] });
  const [createLocationMutation] = useMutation<CreateLocationData>(CREATE_LOCATION, { refetchQueries: [{ query: GET_LOCATIONS }] });
  const [updateLocationMutation] = useMutation(UPDATE_LOCATION, { refetchQueries: [{ query: GET_LOCATIONS }] });
  const [deleteLocationMutation] = useMutation(DELETE_LOCATION, { refetchQueries: [{ query: GET_LOCATIONS }, { query: GET_INVENTORY }] });
  const [createInventoryMutation] = useMutation<CreateInventoryData>(CREATE_INVENTORY, { refetchQueries: [{ query: GET_INVENTORY }] });
  const [updateInventoryMutation] = useMutation(UPDATE_INVENTORY, { refetchQueries: [{ query: GET_INVENTORY }] });
  const [deleteInventoryMutation] = useMutation(DELETE_INVENTORY, { refetchQueries: [{ query: GET_INVENTORY }] });

  const serverItems: Item[] = (itemsData?.clogItems?.nodes ?? []).map(transformItem);
  const locations: Location[] = (locationsData?.clogLocations?.nodes ?? []).map(transformLocation);
  const serverInventory: Inventory[] = (inventoryData?.clogInventoryEntries?.nodes ?? []).map(transformInventory);

  // apply queue operations to server data to produce effective lists
  const items: Item[] = useMemo(() => {
    const map = new Map(serverItems.map((i) => [i.id, i]));
    bulkQueue.forEach((op) => {
      if (op.entity !== 'item') return;
      if (op.type === 'create' && op.data) {
        const itm = op.data as Item;
        map.set(itm.id, itm);
      }
      if (op.type === 'update') {
        const existing = map.get(op.id);
        if (existing) {
          map.set(op.id, { ...existing, ...(op.data as Partial<Item>) });
        }
      }
      if (op.type === 'delete') {
        map.delete(op.id);
      }
    });
    return Array.from(map.values());
  }, [serverItems, bulkQueue]);

  const inventory: Inventory[] = useMemo(() => {
    const map = new Map(serverInventory.map((i) => [i.id, i]));
    bulkQueue.forEach((op) => {
      if (op.entity !== 'inventory') return;
      if (op.type === 'create' && op.data) {
        const inv = op.data as Inventory;
        map.set(inv.id, inv);
      }
      if (op.type === 'update') {
        const existing = map.get(op.id);
        if (existing) {
          map.set(op.id, { ...existing, ...(op.data as Partial<Inventory>) });
        }
      }
      if (op.type === 'delete') {
        map.delete(op.id);
      }
    });
    return Array.from(map.values());
  }, [serverInventory, bulkQueue]);

  const loading = itemsLoading || locationsLoading || inventoryLoading;
  const error = itemsError || locationsError || inventoryError || null;

  // queue helpers
  const addToQueue = (op: BulkOp) => {
    setBulkQueue((prev) => [...prev, op]);
  };
  const clearQueue = () => {
    setBulkQueue([]);
  };

  const enterBulkMode = () => setIsBulkMode(true);
  const exitBulkMode = () => setIsBulkMode(false);

  // sync logic: replay operations sequentially, stop on first error
  const syncBulkQueue = async (): Promise<{ success: boolean; error?: Error }> => {
    // replay ops sequentially using direct network mutations
    for (let i = 0; i < bulkQueue.length; i++) {
      const op = bulkQueue[i];
      try {
        if (op.entity === 'item') {
          if (op.type === 'create') {
            const itemData = op.data as Item;
            const { data } = await createItemMutation({
              variables: {
                input: {
                  title: itemData.name,
                  status: 'PUBLISH',
                  barcodes: itemData.barcodes,
                  ...(itemData.defaultExpiry ? {
                    defaultExpiryUnit: itemData.defaultExpiry.unit.toUpperCase(),
                    defaultExpiryValue: itemData.defaultExpiry.value,
                  } : {}),
                },
              },
            });
            const created = transformItem(data!.createClogItem.clogItem);
            const realId = created.id;
            // update pending ops referencing temp id
            setBulkQueue((q) =>
              q.map((u) => {
                if (u.entity === 'item') {
                  if ((u.type === 'create' || u.type === 'update') && (u.data as any).id === itemData.id) {
                    return { ...u, data: { ...(u.data as any), id: realId } };
                  }
                  if (u.type === 'delete' && u.id === itemData.id) {
                    return { ...u, id: realId };
                  }
                }
                return u;
              })
            );
          } else if (op.type === 'update') {
            const dataItem = op.data as Partial<Item>;
            await updateItemMutation({
              variables: {
                input: {
                  id: op.id,
                  ...(dataItem.name !== undefined ? { title: dataItem.name } : {}),
                  ...(dataItem.barcodes !== undefined ? { barcodes: dataItem.barcodes } : {}),
                  ...(dataItem.defaultExpiry !== undefined ? (
                    dataItem.defaultExpiry ? {
                      defaultExpiryUnit: dataItem.defaultExpiry.unit.toUpperCase(),
                      defaultExpiryValue: dataItem.defaultExpiry.value,
                    } : {
                      defaultExpiryUnit: null,
                      defaultExpiryValue: null,
                    }
                  ) : {}),
                },
              },
            });
          } else if (op.type === 'delete') {
            await deleteItemMutation({ variables: { input: { id: op.id } } });
          }
        } else if (op.entity === 'inventory') {
          if (op.type === 'create') {
            const invData = op.data as Inventory;
            const { data } = await createInventoryMutation({
              variables: {
                input: {
                  title: 'Inventory Entry',
                  status: 'PUBLISH',
                  clogItemId: parseInt(invData.itemId, 10),
                  clogLocationId: parseInt(invData.locationId, 10),
                  dateAdded: invData.dateAdded.toISOString(),
                  dateExpiry: invData.dateExpiry?.toISOString() ?? null,
                },
              },
            });
            const created = transformInventory(data!.createClogInventory.clogInventory);
            const realId = created.id;
            setBulkQueue((q) =>
              q.map((u) => {
                if (u.entity === 'inventory') {
                  if ((u.type === 'create' || u.type === 'update') && (u.data as any).id === invData.id) {
                    return { ...u, data: { ...(u.data as any), id: realId } };
                  }
                  if (u.type === 'delete' && u.id === invData.id) {
                    return { ...u, id: realId };
                  }
                }
                return u;
              })
            );
          } else if (op.type === 'update') {
            const dataInv = op.data as Partial<Inventory>;
            await updateInventoryMutation({
              variables: {
                input: {
                  id: op.id,
                  ...(dataInv.dateExpiry !== undefined ? {
                    dateExpiry: dataInv.dateExpiry?.toISOString() ?? null,
                  } : {}),
                },
              },
            });
          } else if (op.type === 'delete') {
            await deleteInventoryMutation({ variables: { input: { id: op.id } } });
          }
        }
      } catch (err) {
        return { success: false, error: err as Error };
      }
    }
    clearQueue();
    return { success: true };
  };

  const addItem = async (itemData: Omit<Item, 'id' | 'createdAt'>): Promise<Item> => {
    if (isBulkMode) {
      const tempId = `temp-${Date.now()}`;
      const newItem: Item = { ...itemData, id: tempId, createdAt: new Date() } as Item;
      addToQueue({ type: 'create', entity: 'item', data: newItem });
      return newItem;
    }
    const { data } = await createItemMutation({
      variables: {
        input: {
          title: itemData.name,
          status: 'PUBLISH',
          barcodes: itemData.barcodes,
          ...(itemData.defaultExpiry ? {
            defaultExpiryUnit: itemData.defaultExpiry.unit.toUpperCase(),
            defaultExpiryValue: itemData.defaultExpiry.value,
          } : {}),
        },
      },
    });
    return transformItem(data!.createClogItem.clogItem);
  };

  const updateItem = async (id: string, itemData: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<void> => {
    if (isBulkMode) {
      addToQueue({ type: 'update', entity: 'item', id, data: itemData });
      return;
    }
    await updateItemMutation({
      variables: {
        input: {
          id,
          ...(itemData.name !== undefined ? { title: itemData.name } : {}),
          ...(itemData.barcodes !== undefined ? { barcodes: itemData.barcodes } : {}),
          ...(itemData.defaultExpiry !== undefined ? (
            itemData.defaultExpiry ? {
              defaultExpiryUnit: itemData.defaultExpiry.unit.toUpperCase(),
              defaultExpiryValue: itemData.defaultExpiry.value,
            } : {
              defaultExpiryUnit: null,
              defaultExpiryValue: null,
            }
          ) : {}),
        },
      },
    });
  };

  const deleteItem = async (id: string): Promise<void> => {
    if (isBulkMode) {
      addToQueue({ type: 'delete', entity: 'item', id });
      return;
    }
    await deleteItemMutation({ variables: { input: { id } } });
  };

  const getItem = (id: string) => items.find((item) => item.id === id);

  const addLocation = async (locationData: Omit<Location, 'id' | 'createdAt'>): Promise<Location> => {
    const { data } = await createLocationMutation({
      variables: {
        input: {
          title: locationData.name,
          status: 'PUBLISH',
        },
      },
    });
    return transformLocation(data!.createClogLocation.clogLocation);
  };

  const updateLocation = async (id: string, locationData: Partial<Omit<Location, 'id' | 'createdAt'>>): Promise<void> => {
    await updateLocationMutation({
      variables: {
        input: {
          id,
          ...(locationData.name !== undefined ? { title: locationData.name } : {}),
        },
      },
    });
  };

  const deleteLocation = async (id: string): Promise<void> => {
    await deleteLocationMutation({ variables: { input: { id } } });
  };

  const getLocation = (id: string) => locations.find((location) => location.id === id);

  const addInventory = async (inventoryData: Omit<Inventory, 'id' | 'createdAt'>): Promise<Inventory> => {
    if (isBulkMode) {
      const tempId = `temp-${Date.now()}`;
      const newInv: Inventory = { ...inventoryData, id: tempId, createdAt: new Date() } as Inventory;
      addToQueue({ type: 'create', entity: 'inventory', data: newInv });
      return newInv;
    }
    const { data } = await createInventoryMutation({
      variables: {
        input: {
          title: 'Inventory Entry',
          status: 'PUBLISH',
          clogItemId: parseInt(inventoryData.itemId, 10),
          clogLocationId: parseInt(inventoryData.locationId, 10),
          dateAdded: inventoryData.dateAdded.toISOString(),
          dateExpiry: inventoryData.dateExpiry?.toISOString() ?? null,
        },
      },
    });
    return transformInventory(data!.createClogInventory.clogInventory);
  };

  const updateInventory = async (id: string, inventoryData: Partial<Omit<Inventory, 'id' | 'createdAt'>>): Promise<void> => {
    if (isBulkMode) {
      addToQueue({ type: 'update', entity: 'inventory', id, data: inventoryData });
      return;
    }
    await updateInventoryMutation({
      variables: {
        input: {
          id,
          ...(inventoryData.dateExpiry !== undefined ? {
            dateExpiry: inventoryData.dateExpiry?.toISOString() ?? null,
          } : {}),
        },
      },
    });
  };

  const deleteInventory = async (id: string): Promise<void> => {
    if (isBulkMode) {
      addToQueue({ type: 'delete', entity: 'inventory', id });
      return;
    }
    await deleteInventoryMutation({ variables: { input: { id } } });
  };

  const getInventory = (id: string) => inventory.find((inv) => inv.id === id);

  return (
    <DataContext.Provider
      value={{
        items,
        locations,
        inventory,
        addItem,
        updateItem,
        deleteItem,
        getItem,
        addLocation,
        updateLocation,
        deleteLocation,
        getLocation,
        addInventory,
        updateInventory,
        deleteInventory,
        getInventory,
        isBulkMode,
        bulkQueue,
        enterBulkMode,
        exitBulkMode,
        addToQueue,
        syncBulkQueue,
        loading,
        error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
