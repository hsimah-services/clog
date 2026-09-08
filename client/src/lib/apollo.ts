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
  // No typePolicies needed: unlike WPGraphQL's native types, whose stable numeric id
  // lived at `databaseId` behind an opaque relay `id`, Elephentity's entity types
  // expose the entity id directly as `id` — which is exactly what Apollo's default
  // cache normalization already keys on.
  cache: new InMemoryCache(),
});
