import { gql } from '@apollo/client';
import { ITEM_FIELDS, LOCATION_FIELDS, INVENTORY_FIELDS } from '@/graphql/fragments';

export const GET_ITEMS = gql`
  query GetItems {
    clogItems(first: 100) {
      nodes {
        ...ItemFields
      }
    }
  }
  ${ITEM_FIELDS}
`;

export const GET_ITEM = gql`
  query GetItem($id: ID!) {
    clogItem(id: $id, idType: DATABASE_ID) {
      ...ItemFields
    }
  }
  ${ITEM_FIELDS}
`;

export const GET_LOCATIONS = gql`
  query GetLocations {
    clogLocations(first: 100) {
      nodes {
        ...LocationFields
      }
    }
  }
  ${LOCATION_FIELDS}
`;

export const GET_LOCATION = gql`
  query GetLocation($id: ID!) {
    clogLocation(id: $id, idType: DATABASE_ID) {
      ...LocationFields
    }
  }
  ${LOCATION_FIELDS}
`;

export const GET_INVENTORY = gql`
  query GetInventory {
    clogInventoryEntries(first: 100) {
      nodes {
        ...InventoryFields
      }
    }
  }
  ${INVENTORY_FIELDS}
`;

export const GET_INVENTORY_ENTRY = gql`
  query GetInventoryEntry($id: ID!) {
    clogInventory(id: $id, idType: DATABASE_ID) {
      ...InventoryFields
    }
  }
  ${INVENTORY_FIELDS}
`;
