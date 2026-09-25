'use client';

import { useState } from 'react';

interface NameCellProps {
  displayName: string;
}

export default function NameCell({ displayName }: NameCellProps) {
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayName);
      setShowCopiedTooltip(true);

      // Reset tooltip text after 2 seconds
      setTimeout(() => {
        setShowCopiedTooltip(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy name:', err);
    }
  };

  return (
    <div className="relative block w-[180px]">
      <button
        onClick={handleCopy}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-full cursor-pointer rounded text-left transition-colors hover:text-primary focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none"
        aria-label="Copy name to clipboard"
      >
        <span className="block truncate text-foreground">{displayName}</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background">
          {showCopiedTooltip ? 'Copied' : displayName}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-t-4 border-r-4 border-l-4 border-transparent border-t-foreground"></div>
        </div>
      )}
    </div>
  );
}
