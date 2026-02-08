import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
    <DataProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/items/new" element={<NewItemPage />} />
            <Route path="/items/:id" element={<ItemPage />} />
            <Route path="/items/:id/edit" element={<EditItemPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/locations/new" element={<NewLocationPage />} />
            <Route path="/locations/:id" element={<LocationPage />} />
            <Route path="/locations/:id/edit" element={<EditLocationPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/new" element={<NewInventoryPage />} />
            <Route path="/inventory/:id" element={<InventoryItemPage />} />
            <Route path="/inventory/:id/edit" element={<EditInventoryPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
