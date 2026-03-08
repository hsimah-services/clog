import type { ReactNode } from 'react';
import { Header } from './Header';
import { useData } from '@/context/DataContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isBulkMode } = useData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {isBulkMode && (
        <div className="bg-yellow-100 text-yellow-800 text-center py-2">
          Bulk mode active – changes are being queued locally
        </div>
      )}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
