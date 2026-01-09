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
    <div className="relative inline-block w-[200px]">
      <button
        onClick={handleCopy}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-pointer transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded text-left w-full"
        aria-label="Copy name to clipboard"
      >
        <span className="text-sm text-foreground truncate block">
          {displayName}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap pointer-events-none z-10">
          {showCopiedTooltip ? 'Copied' : displayName}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground"></div>
        </div>
      )}
    </div>
  );
}
