import { useLocation } from 'react-router-dom';
import { ItemForm } from '@/components/items/ItemForm';

export function NewItemPage() {
  const location = useLocation();
  const scannedBarcode = (location.state as { scannedBarcode?: string } | null)?.scannedBarcode;

  return (
    <div className="max-w-md">
      <ItemForm initialBarcode={scannedBarcode} />
    </div>
  );
}
