import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import type { Location } from '@/types';

interface LocationDetailsProps {
  location: Location;
}

export function LocationDetails({ location }: LocationDetailsProps) {
  const navigate = useNavigate();
  const { deleteLocation } = useData();

  const handleDelete = () => {
    deleteLocation(location.id);
    navigate('/locations');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{location.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Created</p>
          <p>{location.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/locations/${location.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="outline" onClick={() => navigate('/locations')}>
            Back to List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
