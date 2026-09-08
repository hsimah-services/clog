import { gql } from '@apollo/client';

export const ITEM_FIELDS = gql`
  fragment ItemFields on ClogItem {
    id
    name
    barcode
    createdAt
  }
`;

export const LOCATION_FIELDS = gql`
  fragment LocationFields on ClogLocation {
    id
    name
    createdAt
  }
`;

export const INVENTORY_FIELDS = gql`
  fragment InventoryFields on ClogInventory {
    id
    createdAt
    dateAdded
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
