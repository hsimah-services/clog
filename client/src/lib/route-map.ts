import React from 'react';
import { HomePage } from '@/pages/HomePage';
import { ItemsPage } from '@/pages/items/ItemsPage';
import { NewItemPage } from '@/pages/items/NewItemPage';
import { ItemPage, EditItemPage } from '@/pages/items/ItemPage';
import { LocationsPage } from '@/pages/locations/LocationsPage';
import { NewLocationPage } from '@/pages/locations/NewLocationPage';
import { LocationPage, EditLocationPage } from '@/pages/locations/LocationPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { NewInventoryPage } from '@/pages/inventory/NewInventoryPage';
import { InventoryItemPage, EditInventoryPage } from '@/pages/inventory/InventoryItemPage';

export interface RouteChild {
  path: string;
  element: React.ComponentType<any>;
  label?: string;
}

export interface RouteConfig {
  path: string;
  label?: string;
  element: React.ComponentType<any>;
  children?: RouteChild[];
}

export const routeMap: RouteConfig[] = [
  {
    path: '/',
    element: InventoryPage,
  },
  {
    path: '/home',
    label: 'Home',
    element: HomePage,
  },
  {
    path: '/items',
    label: 'Items',
    element: ItemsPage,
    children: [
      { path: 'new', element: NewItemPage, label: 'New Item' },
      { path: ':id', element: ItemPage },
      { path: ':id/edit', element: EditItemPage },
    ],
  },
  {
    path: '/locations',
    label: 'Locations',
    element: LocationsPage,
    children: [
      { path: 'new', element: NewLocationPage, label: 'New Location' },
      { path: ':id', element: LocationPage },
      { path: ':id/edit', element: EditLocationPage },
    ],
  },
  {
    path: '/inventory',
    label: 'Inventory',
    element: InventoryPage,
    children: [
      { path: 'new', element: NewInventoryPage, label: 'New Inventory' },
      { path: ':id', element: InventoryItemPage },
      { path: ':id/edit', element: EditInventoryPage },
    ],
  },
];

export const navItems = routeMap
  .filter((route) => route.label)
  .map((route) => ({
    path: route.path,
    label: route.label!,
  }));
