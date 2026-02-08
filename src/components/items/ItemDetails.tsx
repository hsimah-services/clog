import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import type { Item } from '@/types';

interface ItemDetailsProps {
  item: Item;
}

export function ItemDetails({ item }: ItemDetailsProps) {
  const navigate = useNavigate();
  const { deleteItem } = useData();

  const handleDelete = () => {
    deleteItem(item.id);
    navigate('/items');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Barcode</p>
          <p className="font-mono">{item.barcode}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Default Expiry</p>
          <p>{item.defaultExpiry ? `${item.defaultExpiry.value} ${item.defaultExpiry.unit}` : 'None'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Created</p>
          <p>{item.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/items/${item.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="outline" onClick={() => navigate('/items')}>
            Back to List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
