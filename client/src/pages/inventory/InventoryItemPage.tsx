import { useParams } from 'react-router-dom';
import { InventoryDetails } from '@/components/inventory/InventoryDetails';
import { InventoryForm } from '@/components/inventory/InventoryForm';
import { useData } from '@/context/DataContext';

export function InventoryItemPage() {
  const { id } = useParams<{ id: string }>();
  const { getInventory } = useData();
  const inventory = id ? getInventory(id) : undefined;

  if (!inventory) {
    return <div className="text-muted-foreground">Inventory entry not found</div>;
  }

  return (
    <div className="max-w-md">
      <InventoryDetails inventory={inventory} />
    </div>
  );
}

export function EditInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const { getInventory } = useData();
  const inventory = id ? getInventory(id) : undefined;

  if (!inventory) {
    return <div className="text-muted-foreground">Inventory entry not found</div>;
  }

  return (
    <div className="max-w-md">
      <InventoryForm inventory={inventory} />
    </div>
  );
}
