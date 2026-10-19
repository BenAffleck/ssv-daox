import { X } from 'lucide-react';

interface ClearButtonProps {
  onClear: () => void;
  label?: string;
  className?: string;
}

/** Inline "x" for search inputs. Place inside a `relative` wrapper around the input. */
export function ClearButton({
  onClear,
  label = 'Clear search',
  className = 'right-3',
}: ClearButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      // Keeps focus in the input so blur handlers don't fire before the click lands.
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        onClear();
        e.currentTarget.parentElement?.querySelector('input')?.focus();
      }}
      className={`absolute top-1/2 -translate-y-1/2 rounded p-0.5 text-muted transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none ${className}`}
    >
      <X size={14} />
    </button>
  );
}
