import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus, Minus, Info } from 'lucide-react';
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

interface GroupEntry {
  inventoryId: string;
  locationId: string;
  locationName: string;
  count: number;
}

interface ItemGroup {
  itemId: string;
  itemName: string;
  entries: GroupEntry[];
  totalCount: number;
}

export function InventoryList() {
  const { inventory, getItem, getLocation, updateInventory, getInventory } = useData();
  const [search, setSearch] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const grouped = inventory.reduce<Map<string, ItemGroup>>((map, inv) => {
    const item = getItem(inv.itemId);
    const location = getLocation(inv.locationId);
    const existing = map.get(inv.itemId);
    const entry: GroupEntry = {
      inventoryId: inv.id,
      locationId: inv.locationId,
      locationName: location?.name ?? 'Unknown',
      count: inv.count,
    };
    if (existing) {
      existing.entries.push(entry);
      existing.totalCount += inv.count;
    } else {
      map.set(inv.itemId, {
        itemId: inv.itemId,
        itemName: item?.name ?? 'Unknown',
        entries: [entry],
        totalCount: inv.count,
      });
    }
    return map;
  }, new Map());

  const searchLower = search.toLowerCase();
  const filteredGroups = Array.from(grouped.values()).filter((group) =>
    group.itemName.toLowerCase().includes(searchLower) ||
    group.entries.some((e) => e.locationName.toLowerCase().includes(searchLower))
  );

  function toggleExpand(itemId: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

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
            <TableHead className="w-8" />
            <TableHead>Item</TableHead>
            <TableHead>Locations</TableHead>
            <TableHead>Total Count</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredGroups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No inventory entries found
              </TableCell>
            </TableRow>
          ) : (
            filteredGroups.map((group) => {
              const isExpanded = expandedItems.has(group.itemId);
              return (
                <InventoryGroupRow
                  key={group.itemId}
                  group={group}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpand(group.itemId)}
                  onIncrement={(inventoryId) => {
                    const inv = getInventory(inventoryId);
                    if (inv) updateInventory(inventoryId, { count: inv.count + 1 });
                  }}
                  onDecrement={(inventoryId) => {
                    const inv = getInventory(inventoryId);
                    if (inv && inv.count > 0) updateInventory(inventoryId, { count: inv.count - 1 });
                  }}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function InventoryGroupRow({
  group,
  isExpanded,
  onToggle,
  onIncrement,
  onDecrement,
}: {
  group: ItemGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onIncrement: (inventoryId: string) => void;
  onDecrement: (inventoryId: string) => void;
}) {
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="w-8">
          <ChevronIcon className="h-4 w-4" />
        </TableCell>
        <TableCell>
          <Link
            to={`/items/${group.itemId}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {group.itemName}
          </Link>
        </TableCell>
        <TableCell>
          {group.entries.map((entry, i) => (
            <span key={entry.inventoryId}>
              {i > 0 && ', '}
              <Link
                to={`/locations/${entry.locationId}`}
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {entry.locationName}
              </Link>
            </span>
          ))}
        </TableCell>
        <TableCell>{group.totalCount}</TableCell>
        <TableCell />
      </TableRow>
      {isExpanded &&
        group.entries.map((entry) => (
          <TableRow key={entry.inventoryId} className="bg-muted/50">
            <TableCell />
            <TableCell />
            <TableCell className="pl-8">
              <Link
                to={`/locations/${entry.locationId}`}
                className="text-primary hover:underline"
              >
                {entry.locationName}
              </Link>
            </TableCell>
            <TableCell>{entry.count}</TableCell>
            <TableCell>
              <div className="flex items-center gap-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-r-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecrement(entry.inventoryId);
                  }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-none border-l-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIncrement(entry.inventoryId);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-l-none border-l-0"
                  asChild
                >
                  <Link to={`/inventory/${entry.inventoryId}`} onClick={(e) => e.stopPropagation()}>
                    <Info className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
