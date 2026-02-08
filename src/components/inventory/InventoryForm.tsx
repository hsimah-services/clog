import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import type { Inventory } from '@/types';

interface InventoryFormProps {
  inventory?: Inventory;
}

export function InventoryForm({ inventory }: InventoryFormProps) {
  const navigate = useNavigate();
  const { items, locations, addInventory, updateInventory } = useData();
  const [itemId, setItemId] = useState(inventory?.itemId ?? '');
  const [locationId, setLocationId] = useState(inventory?.locationId ?? '');
  const [count, setCount] = useState(inventory?.count?.toString() ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { itemId, locationId, count: parseInt(count, 10) };
    if (inventory) {
      updateInventory(inventory.id, data);
      navigate(`/inventory/${inventory.id}`);
    } else {
      const newInventory = addInventory(data);
      navigate(`/inventory/${newInventory.id}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{inventory ? 'Edit Inventory' : 'New Inventory Entry'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item</Label>
            <Select
              id="item"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              required
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
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">{inventory ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
