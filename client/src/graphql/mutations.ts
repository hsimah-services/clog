import { gql } from '@apollo/client';
import { ITEM_FIELDS, LOCATION_FIELDS, INVENTORY_FIELDS } from '@/graphql/fragments';

export const CREATE_ITEM = gql`
  mutation CreateItem($input: CreateClogItemInput!) {
    createClogItem(input: $input) {
      clogItem {
        ...ItemFields
      }
    }
  }
  ${ITEM_FIELDS}
`;

export const UPDATE_ITEM = gql`
  mutation UpdateItem($input: UpdateClogItemInput!) {
    updateClogItem(input: $input) {
      clogItem {
        ...ItemFields
      }
    }
  }
  ${ITEM_FIELDS}
`;

export const DELETE_ITEM = gql`
  mutation DeleteItem($input: DeleteClogItemInput!) {
    deleteClogItem(input: $input) {
      deletedId
    }
  }
`;

export const CREATE_LOCATION = gql`
  mutation CreateLocation($input: CreateClogLocationInput!) {
    createClogLocation(input: $input) {
      clogLocation {
        ...LocationFields
      }
    }
  }
  ${LOCATION_FIELDS}
`;

export const UPDATE_LOCATION = gql`
  mutation UpdateLocation($input: UpdateClogLocationInput!) {
    updateClogLocation(input: $input) {
      clogLocation {
        ...LocationFields
      }
    }
  }
  ${LOCATION_FIELDS}
`;

export const DELETE_LOCATION = gql`
  mutation DeleteLocation($input: DeleteClogLocationInput!) {
    deleteClogLocation(input: $input) {
      deletedId
    }
  }
`;

export const CREATE_INVENTORY = gql`
  mutation CreateInventory($input: CreateClogInventoryInput!) {
    createClogInventory(input: $input) {
      clogInventory {
        ...InventoryFields
      }
    }
  }
  ${INVENTORY_FIELDS}
`;

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($input: UpdateClogInventoryInput!) {
    updateClogInventory(input: $input) {
      clogInventory {
        ...InventoryFields
      }
    }
  }
  ${INVENTORY_FIELDS}
`;

export const DELETE_INVENTORY = gql`
  mutation DeleteInventory($input: DeleteClogInventoryInput!) {
    deleteClogInventory(input: $input) {
      deletedId
    }
  }
`;

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
    }
  }
`;
