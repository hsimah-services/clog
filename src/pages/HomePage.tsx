import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';

export function HomePage() {
  const { items, locations, inventory } = useData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to Clog</h1>
        <p className="text-muted-foreground">Cave Log - Inventory Management System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>Manage your inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{items.length}</p>
            <p className="text-sm text-muted-foreground">Total items</p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link to="/items">View All</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/items/new">Add New</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
            <CardDescription>Manage storage locations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{locations.length}</p>
            <p className="text-sm text-muted-foreground">Total locations</p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link to="/locations">View All</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/locations/new">Add New</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Track item quantities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inventory.length}</p>
            <p className="text-sm text-muted-foreground">Total items in stock</p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link to="/inventory">View All</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/inventory/new">Add New</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
