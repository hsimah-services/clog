import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useData } from '@/context/DataContext';

export function InventoryList() {
  const { inventory, getItem, getLocation } = useData();
  const [search, setSearch] = useState('');

  const filteredInventory = inventory.filter((inv) => {
    const item = getItem(inv.itemId);
    const location = getLocation(inv.locationId);
    const searchLower = search.toLowerCase();
    return (
      item?.name.toLowerCase().includes(searchLower) ||
      location?.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button asChild>
          <Link to="/inventory/new">Add Inventory</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Count</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInventory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No inventory entries found
              </TableCell>
            </TableRow>
          ) : (
            filteredInventory.map((inv) => {
              const item = getItem(inv.itemId);
              const location = getLocation(inv.locationId);
              return (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link to={`/inventory/${inv.id}`} className="text-primary hover:underline">
                      {item?.name ?? 'Unknown'}
                    </Link>
                  </TableCell>
                  <TableCell>{location?.name ?? 'Unknown'}</TableCell>
                  <TableCell>{inv.count}</TableCell>
                  <TableCell>{inv.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
