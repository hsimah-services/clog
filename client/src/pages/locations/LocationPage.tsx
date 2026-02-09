import { useParams } from 'react-router-dom';
import { LocationDetails } from '@/components/locations/LocationDetails';
import { LocationForm } from '@/components/locations/LocationForm';
import { useData } from '@/context/DataContext';

export function LocationPage() {
  const { id } = useParams<{ id: string }>();
  const { getLocation, loading } = useData();
  const location = id ? getLocation(id) : undefined;

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!location) {
    return <div className="text-muted-foreground">Location not found</div>;
  }

  return (
    <div className="max-w-md">
      <LocationDetails location={location} />
    </div>
  );
}

export function EditLocationPage() {
  const { id } = useParams<{ id: string }>();
  const { getLocation, loading } = useData();
  const location = id ? getLocation(id) : undefined;

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!location) {
    return <div className="text-muted-foreground">Location not found</div>;
  }

  return (
    <div className="max-w-md">
      <LocationForm location={location} />
    </div>
  );
}
