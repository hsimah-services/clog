import { ItemList } from '@/components/items/ItemList';
import { SidePanel } from '@/components/layout/SidePanel';

export function ItemsPage() {
  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <h1 className="text-2xl font-bold">Items</h1>
        <ItemList />
      </div>
      <SidePanel basePath="/items" />
    </div>
  );
}
