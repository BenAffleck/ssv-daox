'use client';

import { useState } from 'react';
import { formatAddress } from '@/lib/dao-delegates/utils/address';

interface AddressCellProps {
  address: string;
}

export default function AddressCell({ address }: AddressCellProps) {
  const [tooltipText, setTooltipText] = useState('Copy to clipboard');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setTooltipText('Copied');

      // Reset tooltip text after 2 seconds
      setTimeout(() => {
        setTooltipText('Copy to clipboard');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleCopy}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-pointer transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
        aria-label="Copy address to clipboard"
      >
        <code className="text-xs text-foreground font-mono">
          {formatAddress(address)}
        </code>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap pointer-events-none z-10">
          {tooltipText}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground"></div>
        </div>
      )}
    </div>
  );
}
