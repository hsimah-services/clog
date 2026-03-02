import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ITEMS, GET_LOCATIONS, GET_INVENTORY } from '@/graphql/queries';
import {
  CREATE_ITEM, UPDATE_ITEM, DELETE_ITEM,
  CREATE_LOCATION, UPDATE_LOCATION, DELETE_LOCATION,
  CREATE_INVENTORY, UPDATE_INVENTORY, DELETE_INVENTORY,
} from '@/graphql/mutations';
import type { Item, Location, Inventory } from '@/types';

interface DataContextType {
  items: Item[];
  locations: Location[];
  inventory: Inventory[];
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

  const [createItemMutation] = useMutation<CreateItemData>(CREATE_ITEM, { refetchQueries: [{ query: GET_ITEMS }] });
  const [updateItemMutation] = useMutation(UPDATE_ITEM, { refetchQueries: [{ query: GET_ITEMS }] });
  const [deleteItemMutation] = useMutation(DELETE_ITEM, { refetchQueries: [{ query: GET_ITEMS }, { query: GET_INVENTORY }] });
  const [createLocationMutation] = useMutation<CreateLocationData>(CREATE_LOCATION, { refetchQueries: [{ query: GET_LOCATIONS }] });
  const [updateLocationMutation] = useMutation(UPDATE_LOCATION, { refetchQueries: [{ query: GET_LOCATIONS }] });
  const [deleteLocationMutation] = useMutation(DELETE_LOCATION, { refetchQueries: [{ query: GET_LOCATIONS }, { query: GET_INVENTORY }] });
  const [createInventoryMutation] = useMutation<CreateInventoryData>(CREATE_INVENTORY, { refetchQueries: [{ query: GET_INVENTORY }] });
  const [updateInventoryMutation] = useMutation(UPDATE_INVENTORY, { refetchQueries: [{ query: GET_INVENTORY }] });
  const [deleteInventoryMutation] = useMutation(DELETE_INVENTORY, { refetchQueries: [{ query: GET_INVENTORY }] });

  const items: Item[] = (itemsData?.clogItems?.nodes ?? []).map(transformItem);
  const locations: Location[] = (locationsData?.clogLocations?.nodes ?? []).map(transformLocation);
  const inventory: Inventory[] = (inventoryData?.clogInventoryEntries?.nodes ?? []).map(transformInventory);

  const loading = itemsLoading || locationsLoading || inventoryLoading;
  const error = itemsError || locationsError || inventoryError || null;

  const addItem = async (itemData: Omit<Item, 'id' | 'createdAt'>): Promise<Item> => {
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
