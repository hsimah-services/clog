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
  itemId: string;
  inventoryIds: string[];
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
  const { inventory, getItem, getLocation, addInventory, deleteInventory } = useData();
  const [search, setSearch] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const grouped = inventory.reduce<Map<string, ItemGroup>>((map, inv) => {
    const item = getItem(inv.itemId);
    const location = getLocation(inv.locationId);
    const existing = map.get(inv.itemId);

    if (existing) {
      const existingEntry = existing.entries.find((e) => e.locationId === inv.locationId);
      if (existingEntry) {
        existingEntry.inventoryIds.push(inv.id);
        existingEntry.count += 1;
      } else {
        existing.entries.push({
          itemId: inv.itemId,
          inventoryIds: [inv.id],
          locationId: inv.locationId,
          locationName: location?.name ?? 'Unknown',
          count: 1,
        });
      }
      existing.totalCount += 1;
    } else {
      map.set(inv.itemId, {
        itemId: inv.itemId,
        itemName: item?.name ?? 'Unknown',
        entries: [
          {
            itemId: inv.itemId,
            inventoryIds: [inv.id],
            locationId: inv.locationId,
            locationName: location?.name ?? 'Unknown',
            count: 1,
          },
        ],
        totalCount: 1,
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
                  onIncrement={(entry) => {
                    addInventory({
                      itemId: entry.itemId,
                      locationId: entry.locationId,
                      dateAdded: new Date(),
                      dateExpiry: null,
                    });
                  }}
                  onDecrement={(entry) => {
                    if (entry.inventoryIds.length > 0) {
                      deleteInventory(entry.inventoryIds[entry.inventoryIds.length - 1]);
                    }
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
  onIncrement: (entry: GroupEntry) => void;
  onDecrement: (entry: GroupEntry) => void;
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
            <span key={entry.locationId}>
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
          <TableRow key={entry.locationId} className="bg-muted/50">
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
                    onDecrement(entry);
                  }}
                  disabled={entry.count === 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-none border-l-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIncrement(entry);
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
                  <Link to={`/inventory/${entry.inventoryIds[0]}`} onClick={(e) => e.stopPropagation()}>
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
