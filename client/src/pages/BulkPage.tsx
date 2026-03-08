import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useData } from '@/context/DataContext';

export function BulkPage() {
  const {
    isBulkMode,
    bulkQueue,
    enterBulkMode,
    exitBulkMode,
    syncBulkQueue,
  } = useData();

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSync = async () => {
    setError(null);
    setSyncing(true);
    const result = await syncBulkQueue();
    setSyncing(false);
    if (!result.success) {
      setError(result.error || new Error('unknown error'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bulk / Offline Mode</h1>
      {!isBulkMode ? (
        <Button onClick={enterBulkMode}>Start bulk mode</Button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleSync} disabled={syncing || bulkQueue.length === 0}>
              {syncing ? 'Syncing…' : 'Sync queued operations'}
            </Button>
            <Button variant="outline" onClick={exitBulkMode}>Stop bulk mode</Button>
          </div>
          {error && <div className="text-red-600">Sync failed: {error.message}</div>}
          <div>
            <h2 className="font-semibold">Queued operations</h2>
            {bulkQueue.length === 0 ? (
              <p className="text-muted-foreground">No operations queued.</p>
            ) : (
              <ul className="list-disc pl-6">
                {bulkQueue.map((op, idx) => (
                  <li key={idx} className="text-sm">
                    {op.type} {op.entity}{' '}
                    {op.type !== 'create' && op.id ? `(id ${op.id})` : ''}
                    {op.type === 'create' && op.data && (op.data as any).name
                      ? `: ${(op.data as any).name}`
                      : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
