'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { VotingPowerData } from '@/lib/gnosis/types';

interface VotingPowerBadgeProps {
  votingPowerData: VotingPowerData | null;
  address: string;
}

/**
 * Formats a number with appropriate suffix (K, M, B) for compact display
 */
function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Formats a number with thousands separators for detailed display
 */
function formatDetailedNumber(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

/**
 * Badge showing voting power with an info icon that reveals detailed breakdown
 * Shows fetch icon for on-demand loading when data not pre-fetched
 */
export default function VotingPowerBadge({
  votingPowerData: initialData,
  address,
}: VotingPowerBadgeProps) {
  const [votingPowerData, setVotingPowerData] = useState<VotingPowerData | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setVotingPowerData(initialData);
  }, [initialData]);

  // Calculate popover position based on button location
  const updatePopoverPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: Math.max(8, rect.left + window.scrollX - 16),
      });
    }
  }, []);

  // Update position when popover opens and on scroll/resize
  useEffect(() => {
    if (showPopover) {
      updatePopoverPosition();
      window.addEventListener('scroll', updatePopoverPosition, true);
      window.addEventListener('resize', updatePopoverPosition);
      return () => {
        window.removeEventListener('scroll', updatePopoverPosition, true);
        window.removeEventListener('resize', updatePopoverPosition);
      };
    }
  }, [showPopover, updatePopoverPosition]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    }

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopover]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowPopover(false);
      }
    }

    if (showPopover) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showPopover]);

  // Fetch voting power on demand
  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/voting-power/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data: VotingPowerData = await response.json();
      setVotingPowerData(data);
    } catch {
      setError('Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  // Show fetch button when no data
  if (!votingPowerData) {
    return (
      <button
        onClick={handleFetch}
        disabled={isLoading}
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors disabled:opacity-50"
        title="Fetch voting power"
      >
        {isLoading ? (
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : error ? (
          <span className="text-danger">{error}</span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    );
  }

  const { votingPower, incomingPower, outgoingPower, delegatorCount, delegators } =
    votingPowerData;

  // Calculate net delegated power (incoming - outgoing)
  const netDelegatedPower = incomingPower - outgoingPower;

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Compact voting power display (no SSV suffix) */}
      <span className="text-sm font-medium text-foreground">
        {formatCompactNumber(votingPower)}
      </span>

      {/* Info icon button */}
      <button
        ref={buttonRef}
        onClick={() => setShowPopover(!showPopover)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted hover:text-primary hover:bg-muted/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        aria-label="Show voting power details"
        aria-expanded={showPopover}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Popover rendered via portal to avoid parent opacity inheritance */}
      {showPopover &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'absolute',
              top: popoverPosition.top,
              left: popoverPosition.left,
            }}
            className="z-50 w-[min(380px,calc(100vw-2rem))] rounded-lg border border-border bg-card shadow-lg"
          >
            <div className="p-3 space-y-2">
              <h4 className="font-heading text-sm font-semibold text-foreground">
                Voting Power Breakdown
              </h4>

              <div className="space-y-1.5 text-xs">
                {/* Total voting power */}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Total Voting Power</span>
                  <span className="font-medium text-foreground">
                    {formatDetailedNumber(votingPower)} SSV
                  </span>
                </div>

                {/* Incoming delegations */}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Incoming Delegations</span>
                  <span className="font-medium text-accent">
                    +{formatDetailedNumber(incomingPower)} SSV
                  </span>
                </div>

                {/* Outgoing delegations */}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Outgoing Delegations</span>
                  <span className="font-medium text-danger">
                    -{formatDetailedNumber(outgoingPower)} SSV
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-border my-2"></div>

                {/* Net delegated power */}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Net Delegated</span>
                  <span
                    className={`font-medium ${netDelegatedPower >= 0 ? 'text-accent' : 'text-danger'}`}
                  >
                    {netDelegatedPower >= 0 ? '+' : ''}
                    {formatDetailedNumber(netDelegatedPower)} SSV
                  </span>
                </div>

                {/* Delegator count */}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Delegators</span>
                  <span className="font-medium text-foreground">{delegatorCount}</span>
                </div>

                {/* Delegator addresses list */}
                {delegators.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="text-muted mb-1">Delegating addresses:</div>
                    <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                      {delegators.map((addr) => (
                        <li key={addr}>
                          <code className="text-foreground font-mono text-[10px] break-all">
                            {addr}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
