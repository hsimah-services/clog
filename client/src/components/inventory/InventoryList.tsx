import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus, Minus, Info } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useData } from '@/context/DataContext';
import { calcExpiryDate } from '@/lib/utils';
import type { Inventory } from '@/types';

interface GroupEntry {
  itemId: string;
  inventoryIds: string[];
  locationId: string;
  locationName: string;
  count: number;
  closestExpiry: Date | null;
}

interface ItemGroup {
  itemId: string;
  itemName: string;
  entries: GroupEntry[];
  totalCount: number;
}

function earlierExpiry(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
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
        existingEntry.closestExpiry = earlierExpiry(existingEntry.closestExpiry, inv.dateExpiry);
      } else {
        existing.entries.push({
          itemId: inv.itemId,
          inventoryIds: [inv.id],
          locationId: inv.locationId,
          locationName: location?.name ?? 'Unknown',
          count: 1,
          closestExpiry: inv.dateExpiry,
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
            closestExpiry: inv.dateExpiry,
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
            <TableHead>Closest Expiry</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredGroups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                    const item = getItem(entry.itemId);
                    const dateExpiry = item?.defaultExpiry
                      ? calcExpiryDate(item.defaultExpiry)
                      : null;
                    addInventory({
                      itemId: entry.itemId,
                      locationId: entry.locationId,
                      dateAdded: new Date(),
                      dateExpiry,
                    });
                  }}
                  onDecrement={(entry) => {
                    if (entry.inventoryIds.length > 0) {
                      deleteInventory(entry.inventoryIds[entry.inventoryIds.length - 1]);
                    }
                  }}
                  inventoryRecords={inventory.filter((inv) => inv.itemId === group.itemId)}
                  onDeleteRecord={deleteInventory}
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
  inventoryRecords,
  onDeleteRecord,
}: {
  group: ItemGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onIncrement: (entry: GroupEntry) => void;
  onDecrement: (entry: GroupEntry) => void;
  inventoryRecords: Inventory[];
  onDeleteRecord: (id: string) => void;
}) {
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  function toggleLocation(locationId: string) {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  }

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
        <TableCell>
          {group.entries.reduce<Date | null>((min, e) => earlierExpiry(min, e.closestExpiry), null)?.toLocaleDateString() ?? 'No expiry'}
        </TableCell>
        <TableCell />
      </TableRow>
      {isExpanded &&
        group.entries.map((entry) => {
          const isLocationExpanded = expandedLocations.has(entry.locationId);
          return (
            <LocationEntryRows
              key={entry.locationId}
              entry={entry}
              isLocationExpanded={isLocationExpanded}
              onToggleLocation={() => toggleLocation(entry.locationId)}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              inventoryRecords={inventoryRecords.filter((r) => r.locationId === entry.locationId)}
              onDeleteRecord={onDeleteRecord}
            />
          );
        })}
    </>
  );
}

function LocationEntryRows({
  entry,
  isLocationExpanded,
  onToggleLocation,
  onIncrement,
  onDecrement,
  inventoryRecords,
  onDeleteRecord,
}: {
  entry: GroupEntry;
  isLocationExpanded: boolean;
  onToggleLocation: () => void;
  onIncrement: (entry: GroupEntry) => void;
  onDecrement: (entry: GroupEntry) => void;
  inventoryRecords: Inventory[];
  onDeleteRecord: (id: string) => void;
}) {
  const LocationChevron = isLocationExpanded ? ChevronDown : ChevronRight;

  return (
    <>
      <TableRow className="bg-muted/50 cursor-pointer" onClick={onToggleLocation}>
        <TableCell>
          <LocationChevron className="h-3 w-3 ml-2" />
        </TableCell>
        <TableCell />
        <TableCell className="pl-8">
          <Link
            to={`/locations/${entry.locationId}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {entry.locationName}
          </Link>
        </TableCell>
        <TableCell>{entry.count}</TableCell>
        <TableCell>{entry.closestExpiry?.toLocaleDateString() ?? 'No expiry'}</TableCell>
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
              className="h-7 w-7 rounded-l-none border-l-0"
              onClick={(e) => {
                e.stopPropagation();
                onIncrement(entry);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isLocationExpanded &&
        inventoryRecords.map((inv) => (
          <TableRow key={inv.id} className="bg-muted/30">
            <TableCell />
            <TableCell />
            <TableCell className="pl-12 text-sm text-muted-foreground">
              Added {inv.dateAdded.toLocaleDateString()}
            </TableCell>
            <TableCell />
            <TableCell className="text-sm">
              {inv.dateExpiry?.toLocaleDateString() ?? 'No expiry'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-r-none"
                  asChild
                >
                  <Link to={`/inventory/${inv.id}`} onClick={(e) => e.stopPropagation()}>
                    <Info className="h-3 w-3" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-l-none border-l-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRecord(inv.id);
                  }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
