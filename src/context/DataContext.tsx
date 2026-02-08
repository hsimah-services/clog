import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Item, Location, Inventory } from '@/types';
import { generateId } from '@/lib/utils';

interface DataContextType {
  items: Item[];
  locations: Location[];
  inventory: Inventory[];
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => Item;
  updateItem: (id: string, item: Partial<Omit<Item, 'id' | 'createdAt'>>) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => Item | undefined;
  addLocation: (location: Omit<Location, 'id' | 'createdAt'>) => Location;
  updateLocation: (id: string, location: Partial<Omit<Location, 'id' | 'createdAt'>>) => void;
  deleteLocation: (id: string) => void;
  getLocation: (id: string) => Location | undefined;
  addInventory: (inventory: Omit<Inventory, 'id' | 'createdAt'>) => Inventory;
  updateInventory: (id: string, inventory: Partial<Omit<Inventory, 'id' | 'createdAt'>>) => void;
  deleteInventory: (id: string) => void;
  getInventory: (id: string) => Inventory | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);

  const addItem = (itemData: Omit<Item, 'id' | 'createdAt'>): Item => {
    const newItem: Item = {
      ...itemData,
      id: generateId(),
      createdAt: new Date(),
    };
    setItems((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateItem = (id: string, itemData: Partial<Omit<Item, 'id' | 'createdAt'>>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...itemData } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setInventory((prev) => prev.filter((inv) => inv.itemId !== id));
  };

  const getItem = (id: string) => items.find((item) => item.id === id);

  const addLocation = (locationData: Omit<Location, 'id' | 'createdAt'>): Location => {
    const newLocation: Location = {
      ...locationData,
      id: generateId(),
      createdAt: new Date(),
    };
    setLocations((prev) => [...prev, newLocation]);
    return newLocation;
  };

  const updateLocation = (id: string, locationData: Partial<Omit<Location, 'id' | 'createdAt'>>) => {
    setLocations((prev) =>
      prev.map((location) => (location.id === id ? { ...location, ...locationData } : location))
    );
  };

  const deleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((location) => location.id !== id));
    setInventory((prev) => prev.filter((inv) => inv.locationId !== id));
  };

  const getLocation = (id: string) => locations.find((location) => location.id === id);

  const addInventory = (inventoryData: Omit<Inventory, 'id' | 'createdAt'>): Inventory => {
    const newInventory: Inventory = {
      ...inventoryData,
      id: generateId(),
      createdAt: new Date(),
    };
    setInventory((prev) => [...prev, newInventory]);
    return newInventory;
  };

  const updateInventory = (id: string, inventoryData: Partial<Omit<Inventory, 'id' | 'createdAt'>>) => {
    setInventory((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...inventoryData } : inv))
    );
  };

  const deleteInventory = (id: string) => {
    setInventory((prev) => prev.filter((inv) => inv.id !== id));
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
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
