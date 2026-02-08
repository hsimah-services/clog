import { useNavigate, useOutlet } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidePanelProps {
  basePath: string;
}

export function SidePanel({ basePath }: SidePanelProps) {
  const outlet = useOutlet();
  const navigate = useNavigate();

  if (!outlet) {
    return null;
  }

  return (
    <aside className="w-96 shrink-0 border-l pl-6 overflow-y-auto">
      <div className="flex justify-end mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(basePath)}
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {outlet}
    </aside>
  );
}
