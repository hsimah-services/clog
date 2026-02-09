import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useData } from '@/context/DataContext';
import type { Location } from '@/types';
import { CloseButton } from '../ui/CloseButton';

interface LocationDetailsProps {
  location: Location;
}

export function LocationDetails({ location }: LocationDetailsProps) {
  const navigate = useNavigate();
  const { deleteLocation } = useData();

  const { onClose } = useOutletContext<{ onClose?: () => void }>();
  const handleDelete = () => {
    deleteLocation(location.id);
    navigate('/locations');
  };

  return (
    <Card
      header={
        <CardHeader title={<CardTitle>{location.name}</CardTitle>}>
          {onClose && <CloseButton onClose={onClose} />}
        </CardHeader>
      }
      content={
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
      }
    />
  );
}
