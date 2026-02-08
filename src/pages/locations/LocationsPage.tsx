import { LocationList } from '@/components/locations/LocationList';
import { SidePanel } from '@/components/layout/SidePanel';

export function LocationsPage() {
  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <h1 className="text-2xl font-bold">Locations</h1>
        <LocationList />
      </div>
      <SidePanel basePath="/locations" />
    </div>
  );
}
