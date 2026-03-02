import { useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerDialog({ open, onOpenChange, onScan }: BarcodeScannerDialogProps) {
  const handleDetected = useCallback(
    (rawValue: string) => {
      onScan(rawValue);
      onOpenChange(false);
    },
    [onScan, onOpenChange]
  );

  const { videoRef, start, stop, capture, isScanning, error } = useBarcodeScanner({
    onDetected: handleDetected,
  });

  useEffect(() => {
    if (open) {
      start();
    } else {
      stop();
    }
  }, [open, start, stop]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Scan Barcode</DialogTitle>
        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Starting camera...
              </div>
            )}
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Point camera at barcode. Auto-detection runs continuously, or tap Capture to detect now.
          </p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={capture} disabled={!isScanning}>
              Capture
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
