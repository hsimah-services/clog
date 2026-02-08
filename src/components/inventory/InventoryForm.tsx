import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CloseButton } from '@/components/ui/CloseButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import { calcExpiryDate } from '@/lib/utils';
import type { Inventory } from '@/types';

interface InventoryFormProps {
  inventory?: Inventory;
  onClose?: () => void;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function InventoryForm({ inventory, onClose }: InventoryFormProps) {
  const navigate = useNavigate();
  const { items, locations, addInventory, updateInventory, getItem } = useData();
  const [itemId, setItemId] = useState(inventory?.itemId ?? '');
  const [locationId, setLocationId] = useState(inventory?.locationId ?? '');
  const [dateAdded] = useState(toDateInputValue(inventory?.dateAdded ?? new Date()));
  const [dateExpiry, setDateExpiry] = useState(
    inventory?.dateExpiry ? toDateInputValue(inventory.dateExpiry) : ''
  );

  const handleItemChange = (newItemId: string) => {
    setItemId(newItemId);
    const item = getItem(newItemId);
    if (item?.defaultExpiry) {
      setDateExpiry(toDateInputValue(calcExpiryDate(item.defaultExpiry)));
    } else {
      setDateExpiry('');
    }
  };

  const isEditing = !!inventory;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateInventory(inventory.id, {
        dateExpiry: dateExpiry ? new Date(dateExpiry + 'T00:00:00.000Z') : null,
      });
      navigate(`/inventory/${inventory.id}`);
    } else {
      const data = {
        itemId,
        locationId,
        dateAdded: new Date(dateAdded + 'T00:00:00.000Z'),
        dateExpiry: dateExpiry ? new Date(dateExpiry + 'T00:00:00.000Z') : null,
      };
      const newInventory = addInventory(data);
      navigate(`/inventory/${newInventory.id}`);
    }
  };

  return (
    <Card>
      <CardHeader >
        <CardTitle>{isEditing ? 'Edit Inventory' : 'New Inventory Entry'}</CardTitle>
        {onClose && <CloseButton onClose={onClose} />}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item</Label>
            <Select
              id="item"
              value={itemId}
              onChange={(e) => handleItemChange(e.target.value)}
              required
              disabled={isEditing}
            >
              <option value="">Select an item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              id="location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
              disabled={isEditing}
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
            <Label htmlFor="dateAdded">Date Added</Label>
            <Input
              id="dateAdded"
              type="date"
              value={dateAdded}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateExpiry">Expiry Date (optional)</Label>
            <Input
              id="dateExpiry"
              type="date"
              value={dateExpiry}
              onChange={(e) => setDateExpiry(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
