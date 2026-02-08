import { LocationList } from '@/components/locations/LocationList';

export function LocationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Locations</h1>
      <LocationList />
    </div>
  );
}
