import { InventoryList } from '@/components/inventory/InventoryList';

export function InventoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <InventoryList />
    </div>
  );
}
