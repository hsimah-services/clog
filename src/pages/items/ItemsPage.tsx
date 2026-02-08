import { ItemList } from '@/components/items/ItemList';

export function ItemsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Items</h1>
      <ItemList />
    </div>
  );
}
