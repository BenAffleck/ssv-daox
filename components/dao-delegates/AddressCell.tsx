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
        className="cursor-pointer rounded transition-colors hover:text-primary focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none"
        aria-label="Copy address to clipboard"
      >
        <code className="font-mono text-xs text-foreground">{formatAddress(address)}</code>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background">
          {tooltipText}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-t-4 border-r-4 border-l-4 border-transparent border-t-foreground"></div>
        </div>
      )}
    </div>
  );
}
