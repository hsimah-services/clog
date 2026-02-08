import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import type { Item } from '@/types';

interface ItemFormProps {
  item?: Item;
}

export function ItemForm({ item }: ItemFormProps) {
  const navigate = useNavigate();
  const { addItem, updateItem, locations, addInventory } = useData();
  const [name, setName] = useState(item?.name ?? '');
  const [barcodes, setBarcodes] = useState<string[]>([...(item?.barcodes ?? []), '']);
  const [locationId, setLocationId] = useState('');
  const [count, setCount] = useState('');

  const updateBarcode = (index: number, value: string) => {
    const updated = [...barcodes];
    updated[index] = value;
    // Add a new empty input if the user is typing in the last field
    if (index === updated.length - 1 && value !== '') {
      updated.push('');
    }
    setBarcodes(updated);
  };

  const removeBarcode = (index: number) => {
    const updated = barcodes.filter((_, i) => i !== index);
    // Always keep at least one empty input
    if (updated.length === 0 || updated[updated.length - 1] !== '') {
      updated.push('');
    }
    setBarcodes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredBarcodes = barcodes.filter((b) => b.trim() !== '');
    if (item) {
      updateItem(item.id, { name, barcodes: filteredBarcodes });
      navigate(`/items/${item.id}`);
    } else {
      const newItem = addItem({ name, barcodes: filteredBarcodes });
      if (locationId) {
        addInventory({ itemId: newItem.id, locationId, count: parseInt(count, 10) || 0 });
      }
      navigate(`/items/${newItem.id}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item ? 'Edit Item' : 'New Item'}</CardTitle>
      </CardHeader>
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
            <Label>Barcodes</Label>
            {barcodes.map((barcode, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={barcode}
                  onChange={(e) => updateBarcode(index, e.target.value)}
                  placeholder="Enter barcode"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBarcode(index)}
                  disabled={barcodes.length === 1 && barcode === ''}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
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
    </Card>
  );
}
