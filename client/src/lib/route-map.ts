import React from 'react';

const HomePage = React.lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const ItemsPage = React.lazy(() => import('@/pages/items/ItemsPage').then(m => ({ default: m.ItemsPage })));
const NewItemPage = React.lazy(() => import('@/pages/items/NewItemPage').then(m => ({ default: m.NewItemPage })));
const ItemPage = React.lazy(() => import('@/pages/items/ItemPage').then(m => ({ default: m.ItemPage })));
const EditItemPage = React.lazy(() => import('@/pages/items/ItemPage').then(m => ({ default: m.EditItemPage })));
const LocationsPage = React.lazy(() => import('@/pages/locations/LocationsPage').then(m => ({ default: m.LocationsPage })));
const NewLocationPage = React.lazy(() => import('@/pages/locations/NewLocationPage').then(m => ({ default: m.NewLocationPage })));
const LocationPage = React.lazy(() => import('@/pages/locations/LocationPage').then(m => ({ default: m.LocationPage })));
const EditLocationPage = React.lazy(() => import('@/pages/locations/LocationPage').then(m => ({ default: m.EditLocationPage })));
const InventoryPage = React.lazy(() => import('@/pages/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })));
const NewInventoryPage = React.lazy(() => import('@/pages/inventory/NewInventoryPage').then(m => ({ default: m.NewInventoryPage })));
const InventoryItemPage = React.lazy(() => import('@/pages/inventory/InventoryItemPage').then(m => ({ default: m.InventoryItemPage })));
const EditInventoryPage = React.lazy(() => import('@/pages/inventory/InventoryItemPage').then(m => ({ default: m.EditInventoryPage })));

export interface RouteChild {
  path: string;
  element: React.ComponentType;
  label?: string;
}

export interface RouteConfig {
  path: string;
  label?: string;
  element: React.ComponentType;
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
