import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getToken } from '@/lib/auth';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8080/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = getToken();
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const client = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      ClogItem: {
        keyFields: ['databaseId'],
      },
      ClogLocation: {
        keyFields: ['databaseId'],
      },
      ClogInventory: {
        keyFields: ['databaseId'],
      },
    },
  }),
});
