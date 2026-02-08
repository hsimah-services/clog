export interface Item {
  id: string;
  name: string;
  barcode: string;
  createdAt: Date;
}

export interface Location {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Inventory {
  id: string;
  itemId: string;
  locationId: string;
  count: number;
  createdAt: Date;
}
