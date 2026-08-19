'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { DelegationEntry, VotingPowerData } from '@/lib/gnosis/types';

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
 * Copies a list of addresses (newline separated) to the clipboard
 */
function CopyAddressesButton({
  addresses,
  label,
}: {
  addresses: string[];
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(addresses.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy addresses:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center w-4 h-4 rounded text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
      title={copied ? 'Copied' : label}
      aria-label={label}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5 text-accent"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
        </svg>
      )}
    </button>
  );
}

/**
 * Lists delegating addresses with the absolute power moved across each edge
 */
function DelegationList({
  title,
  entries,
  sign,
  amountClassName,
  copyLabel,
}: {
  title: string;
  entries: DelegationEntry[];
  sign: '+' | '-';
  amountClassName: string;
  copyLabel: string;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 pt-2 border-t border-border">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-muted">{title}</span>
        <CopyAddressesButton
          addresses={entries.map((entry) => entry.address)}
          label={copyLabel}
        />
      </div>
      <ul className="space-y-0.5 max-h-32 overflow-y-auto">
        {entries.map((entry) => (
          <li key={entry.address} className="flex items-baseline justify-between gap-2">
            <code className="text-foreground font-mono text-[10px] break-all">
              {entry.address}
            </code>
            <span
              className={`shrink-0 font-medium tabular-nums text-[10px] ${amountClassName}`}
            >
              {entry.power === null
                ? '\u2014'
                : `${sign}${formatDetailedNumber(entry.power)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
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

  const {
    votingPower,
    incomingPower,
    outgoingPower,
    delegatorCount,
    incomingDelegations,
    outgoingDelegations,
  } = votingPowerData;

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
              <p className="text-[11px] text-muted">
                Values shown in SSV + cSSV.
              </p>

              <div className="space-y-1.5 text-xs">
                {/* Total voting power */}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Total Voting Power</span>
                  <span className="font-medium text-foreground">
                    {formatDetailedNumber(votingPower)}
                  </span>
                </div>

                {/* Incoming delegations */}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Incoming Delegations</span>
                  <span className="font-medium text-accent">
                    +{formatDetailedNumber(incomingPower)}
                  </span>
                </div>

                {/* Outgoing delegations */}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Outgoing Delegations</span>
                  <span className="font-medium text-danger">
                    -{formatDetailedNumber(outgoingPower)}
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
                    {formatDetailedNumber(netDelegatedPower)}
                  </span>
                </div>

                {/* Delegator count */}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Delegators</span>
                  <span className="font-medium text-foreground">{delegatorCount}</span>
                </div>

                {/* Delegating addresses with absolute amounts */}
                <DelegationList
                  title="Delegating in"
                  entries={incomingDelegations}
                  sign="+"
                  amountClassName="text-accent"
                  copyLabel="Copy incoming delegator addresses"
                />
                <DelegationList
                  title="Delegating out"
                  entries={outgoingDelegations}
                  sign="-"
                  amountClassName="text-danger"
                  copyLabel="Copy outgoing delegate addresses"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
