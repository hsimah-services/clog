import { gql } from '@apollo/client';

export const ITEM_FIELDS = gql`
  fragment ItemFields on ClogItem {
    databaseId
    title
    date
    barcodes
    defaultExpiry {
      unit
      value
    }
  }
`;

export const LOCATION_FIELDS = gql`
  fragment LocationFields on ClogLocation {
    databaseId
    title
    date
  }
`;

export const INVENTORY_FIELDS = gql`
  fragment InventoryFields on ClogInventory {
    databaseId
    date
    dateAdded
    dateExpiry
    item {
      ...ItemFields
    }
    location {
      ...LocationFields
    }
  }
  ${ITEM_FIELDS}
  ${LOCATION_FIELDS}
`;
