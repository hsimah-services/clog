import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '@/lib/apollo';
import { DataProvider } from '@/context/DataContext';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { ItemsPage } from '@/pages/items/ItemsPage';
import { NewItemPage } from '@/pages/items/NewItemPage';
import { ItemPage, EditItemPage } from '@/pages/items/ItemPage';
import { LocationsPage } from '@/pages/locations/LocationsPage';
import { NewLocationPage } from '@/pages/locations/NewLocationPage';
import { LocationPage, EditLocationPage } from '@/pages/locations/LocationPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { NewInventoryPage } from '@/pages/inventory/NewInventoryPage';
import { InventoryItemPage, EditInventoryPage } from '@/pages/inventory/InventoryItemPage';

function App() {
  return (
    <ApolloProvider client={client}>
    <DataProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/items" element={<ItemsPage />}>
              <Route path="new" element={<NewItemPage />} />
              <Route path=":id" element={<ItemPage />} />
              <Route path=":id/edit" element={<EditItemPage />} />
            </Route>
            <Route path="/locations" element={<LocationsPage />}>
              <Route path="new" element={<NewLocationPage />} />
              <Route path=":id" element={<LocationPage />} />
              <Route path=":id/edit" element={<EditLocationPage />} />
            </Route>
            <Route path="/inventory" element={<InventoryPage />}>
              <Route path="new" element={<NewInventoryPage />} />
              <Route path=":id" element={<InventoryItemPage />} />
              <Route path=":id/edit" element={<EditInventoryPage />} />
            </Route>
          </Routes>
        </Layout>
      </BrowserRouter>
    </DataProvider>
    </ApolloProvider>
  );
}

export default App;
