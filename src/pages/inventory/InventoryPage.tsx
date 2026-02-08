import { InventoryList } from '@/components/inventory/InventoryList';
import { SidePanel } from '@/components/layout/SidePanel';

export function InventoryPage() {
  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <InventoryList />
      </div>
      <SidePanel basePath="/inventory" />
    </div>
  );
}
