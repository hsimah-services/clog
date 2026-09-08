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
  id: string;
  name: string;
  barcode: string | null;
  createdAt: string;
}

interface GraphQLLocation {
  id: string;
  name: string;
  createdAt: string;
}

interface GraphQLInventory {
  id: string;
  createdAt: string;
  dateAdded: string;
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
    id: gqlItem.id,
    name: gqlItem.name,
    barcode: gqlItem.barcode,
    createdAt: new Date(gqlItem.createdAt),
  };
}

function transformLocation(gqlLocation: GraphQLLocation): Location {
  return {
    id: gqlLocation.id,
    name: gqlLocation.name,
    createdAt: new Date(gqlLocation.createdAt),
  };
}

function transformInventory(gqlInventory: GraphQLInventory): Inventory {
  return {
    id: gqlInventory.id,
    itemId: gqlInventory.item?.id ?? '',
    locationId: gqlInventory.location?.id ?? '',
    dateAdded: new Date(gqlInventory.dateAdded),
    createdAt: new Date(gqlInventory.createdAt),
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
          name: itemData.name,
          barcode: itemData.barcode,
          // The schema requires createdAt on every create input even though nothing
          // else derives it server-side; this is genuinely where it comes from.
          createdAt: new Date().toISOString(),
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
          ...(itemData.name !== undefined ? { name: itemData.name } : {}),
          ...(itemData.barcode !== undefined ? { barcode: itemData.barcode } : {}),
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
          name: locationData.name,
          createdAt: new Date().toISOString(),
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
          ...(locationData.name !== undefined ? { name: locationData.name } : {}),
        },
      },
    });
  };

  const deleteLocation = async (id: string): Promise<void> => {
    await deleteLocationMutation({ variables: { input: { id } } });
  };

  const getLocation = (id: string) => locations.find((location) => location.id === id);

  const addInventory = async (inventoryData: Omit<Inventory, 'id' | 'createdAt'>): Promise<Inventory> => {
    const item = getItem(inventoryData.itemId);
    const location = getLocation(inventoryData.locationId);
    const { data } = await createInventoryMutation({
      variables: {
        input: {
          // No trigger derives this server-side (see wp clog seed's convention in
          // server/includes/seed-data.php) — it is what the admin list shows.
          name: `${item?.name ?? 'Unknown'} @ ${location?.name ?? 'Unknown'}`,
          createdAt: new Date().toISOString(),
          dateAdded: inventoryData.dateAdded.toISOString(),
          item: inventoryData.itemId,
          location: inventoryData.locationId,
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
          ...(inventoryData.dateAdded !== undefined ? { dateAdded: inventoryData.dateAdded.toISOString() } : {}),
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
