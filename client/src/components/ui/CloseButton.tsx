import { X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface CloseButtonProps {
  onClose: () => void;
}

export function CloseButton({ onClose }: CloseButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClose}
      aria-label="Close panel"
      className="h-8 w-8 shrink-0"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
