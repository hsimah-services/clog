import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '@/lib/apollo';
import { DataProvider } from '@/context/DataContext';
import { Layout } from '@/components/layout/Layout';
import { routeMap } from '@/lib/route-map';

function App() {
  return (
    <ApolloProvider client={client}>
      <DataProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {routeMap.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<route.element />}
                >
                  {route.children?.map((child) => (
                    <Route
                      key={`${route.path}/${child.path}`}
                      path={child.path}
                      element={<child.element />}
                    />
                  ))}
                </Route>
              ))}
            </Routes>
          </Layout>
        </BrowserRouter>
      </DataProvider>
    </ApolloProvider>
  );
}

export default App;
