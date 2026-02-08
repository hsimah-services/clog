export interface Item {
  id: string;
  name: string;
  barcodes: string[];
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
  dateAdded: Date;
  dateExpiry: Date | null;
  createdAt: Date;
}