import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { CloseButton } from '@/components/ui/CloseButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarcodeScannerDialog } from '@/components/barcode/BarcodeScannerDialog';
import { useData } from '@/context/DataContext';
import type { Item } from '@/types';

interface ItemDetailsProps {
  item: Item;
}

export function ItemDetails({ item }: ItemDetailsProps) {
  const navigate = useNavigate();
  const { deleteItem, updateItem } = useData();
  const { onClose } = useOutletContext<{ onClose?: () => void }>();
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleDelete = async () => {
    await deleteItem(item.id);
    navigate('/items');
  };

  const handleScanBarcode = async (barcode: string) => {
    await updateItem(item.id, { barcode });
  };

  return (
    <>
      <Card
        header={
          <CardHeader title={<CardTitle>{item.name}</CardTitle>}>
            {onClose && <CloseButton onClose={onClose} />}
          </CardHeader>
        }
        content={
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Barcode</p>
              <p className="font-mono">{item.barcode ?? 'None'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>{item.createdAt.toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/items/${item.id}/edit`)}>Edit</Button>
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                Scan Barcode
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </CardContent>
        }
      />
      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScanBarcode}
      />
    </>
  );
}
