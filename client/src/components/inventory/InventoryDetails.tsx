import { useNavigate, useOutletContext } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { CloseButton } from '@/components/ui/CloseButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useData } from '@/context/DataContext';
import type { Inventory } from '@/types';

interface InventoryDetailsProps {
  inventory: Inventory;
}

export function InventoryDetails({ inventory }: InventoryDetailsProps) {
  const navigate = useNavigate();
  const { getItem, getLocation, deleteInventory } = useData();
  const { onClose } = useOutletContext<{ onClose?: () => void }>();
  const item = getItem(inventory.itemId);
  const location = getLocation(inventory.locationId);

  const handleDelete = async () => {
    await deleteInventory(inventory.id);
    navigate('/inventory');
  };

  return (
    <Card
      header={
        <CardHeader title={<CardTitle>Inventory Entry</CardTitle>}>
          {onClose && <CloseButton onClose={onClose} />}
        </CardHeader>
      }
      content={
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Item</p>
            <p>{item?.name ?? 'Unknown Item'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p>{location?.name ?? 'Unknown Location'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date Added</p>
            <p>{inventory.dateAdded.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p>{inventory.createdAt.toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/inventory/${inventory.id}/edit`)}>Edit</Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </CardContent>
      }
    />
  );
}
