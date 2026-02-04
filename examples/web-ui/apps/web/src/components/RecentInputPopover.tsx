import { useEffect, useRef } from 'react';
import { Clock3, X } from 'lucide-react';

interface RecentInputPopoverProps {
  inputs: string[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (input: string) => void;
}

export function RecentInputPopover({ inputs, isOpen, onClose, onSelect }: RecentInputPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || inputs.length === 0) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-lg overflow-hidden z-[100]"
      style={{ maxHeight: '200px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="w-3 h-3" />
          <span>最近输入</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* Input List */}
      <div className="overflow-y-auto" style={{ maxHeight: '160px' }}>
        {inputs.map((input, index) => (
          <button
            key={index}
            onClick={() => {
              onSelect(input);
              onClose();
            }}
            className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-b-0 truncate"
          >
            {input}
          </button>
        ))}
      </div>
    </div>
  );
}
