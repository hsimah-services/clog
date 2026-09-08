import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanBarcode } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarcodeScannerDialog } from '@/components/barcode/BarcodeScannerDialog';
import { useData } from '@/context/DataContext';
import type { Item } from '@/types';

interface ItemFormProps {
  item?: Item;
  initialBarcode?: string;
}

export function ItemForm({ item, initialBarcode }: ItemFormProps) {
  const navigate = useNavigate();
  const { addItem, updateItem, locations, addInventory } = useData();
  const [name, setName] = useState(item?.name ?? '');
  const [barcode, setBarcode] = useState(item?.barcode ?? initialBarcode ?? '');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [count, setCount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBarcode = barcode.trim() || null;
    if (item) {
      await updateItem(item.id, { name, barcode: trimmedBarcode });
      navigate(`/items/${item.id}`);
    } else {
      const newItem = await addItem({ name, barcode: trimmedBarcode });
      if (locationId) {
        const itemCount = parseInt(count, 10) || 0;
        for (let i = 0; i < itemCount; i++) {
          await addInventory({ itemId: newItem.id, locationId, dateAdded: new Date() });
        }
      }
      navigate(`/items/${newItem.id}`);
    }
  };

  return (
    <>
      <Card
        header={<CardHeader title={<CardTitle>{item ? 'Edit Item' : 'New Item'}</CardTitle>} />}
        content={
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Enter barcode"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setScannerOpen(true)}
                    aria-label="Scan barcode"
                  >
                    <ScanBarcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {!item && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <Label className="text-base font-semibold">Initial Inventory (optional)</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      id="location"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                    >
                      <option value="">Select a location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="count">Count</Label>
                    <Input
                      id="count"
                      type="number"
                      min="0"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      placeholder="Enter count"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Button type="submit">{item ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        }
      />
      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={setBarcode}
      />
    </>
  );
}
