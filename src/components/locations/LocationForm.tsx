import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useData } from '@/context/DataContext';
import type { Location } from '@/types';

interface LocationFormProps {
  location?: Location;
}

export function LocationForm({ location }: LocationFormProps) {
  const navigate = useNavigate();
  const { addLocation, updateLocation } = useData();
  const [name, setName] = useState(location?.name ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location) {
      updateLocation(location.id, { name });
      navigate(`/locations/${location.id}`);
    } else {
      const newLocation = addLocation({ name });
      navigate(`/locations/${newLocation.id}`);
    }
  };

  return (
    <Card
      header={<CardHeader title={<CardTitle>{location ? 'Edit Location' : 'New Location'}</CardTitle>} />}
      content={
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter location name"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{location ? 'Update' : 'Create'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      }
    />
  );
}
