import { useNavigate, useOutlet, Outlet } from 'react-router-dom';

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
      <Outlet context={{ onClose: () => navigate(basePath) }} />
    </aside>
  );
}
