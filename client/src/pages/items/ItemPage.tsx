import { useParams } from 'react-router-dom';
import { ItemDetails } from '@/components/items/ItemDetails';
import { ItemForm } from '@/components/items/ItemForm';
import { useData } from '@/context/DataContext';

export function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const { getItem, loading } = useData();
  const item = id ? getItem(id) : undefined;

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!item) {
    return <div className="text-muted-foreground">Item not found</div>;
  }

  return (
    <div className="max-w-md">
      <ItemDetails item={item} />
    </div>
  );
}

export function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const { getItem, loading } = useData();
  const item = id ? getItem(id) : undefined;

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!item) {
    return <div className="text-muted-foreground">Item not found</div>;
  }

  return (
    <div className="max-w-md">
      <ItemForm item={item} />
    </div>
  );
}
