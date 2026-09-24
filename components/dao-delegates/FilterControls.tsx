'use client';

import { useCallback, useState } from 'react';

interface FilterControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showEligibleOnly: boolean;
  onEligibleOnlyChange: (value: boolean) => void;
  showChangesOnly: boolean;
  onShowChangesOnlyChange: (value: boolean) => void;
  showCurrentOnly: boolean;
  onShowCurrentOnlyChange: (value: boolean) => void;
  forumHandles: string[];
  discordHandles: string[];
}

export default function FilterControls({
  searchQuery,
  onSearchChange,
  showEligibleOnly,
  onEligibleOnlyChange,
  showChangesOnly,
  onShowChangesOnlyChange,
  showCurrentOnly,
  onShowCurrentOnlyChange,
  forumHandles,
  discordHandles,
}: FilterControlsProps) {
  const [copiedType, setCopiedType] = useState<'forum' | 'discord' | null>(null);

  const copyHandles = useCallback(async (handles: string[], type: 'forum' | 'discord') => {
    const text = handles.map((h) => (h.startsWith('@') ? h : `@${h}`)).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  }, []);

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="min-w-[240px] flex-1">
        <input
          type="text"
          placeholder="Search by name, ENS, handle or address..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="filter-input"
          aria-label="Search delegates"
        />
      </div>

      {/* Eligible only filter */}
      <label className="filter-label">
        <input
          type="checkbox"
          checked={showEligibleOnly}
          onChange={(e) => onEligibleOnlyChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
        />
        <span>Eligible Only</span>
      </label>

      {/* Show changes only filter */}
      <label className="filter-label">
        <input
          type="checkbox"
          checked={showChangesOnly}
          onChange={(e) => onShowChangesOnlyChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
        />
        <span>Changes Only</span>
      </label>

      {/* Show current delegates only filter */}
      <label className="filter-label">
        <input
          type="checkbox"
          checked={showCurrentOnly}
          onChange={(e) => onShowCurrentOnlyChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
        />
        <span>Delegates Only</span>
      </label>

      {/* Copy handles buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => copyHandles(forumHandles, 'forum')}
          disabled={forumHandles.length === 0}
          className="filter-label disabled:cursor-not-allowed disabled:opacity-60"
          title={`Copy ${forumHandles.length} forum handles to clipboard`}
        >
          {copiedType === 'forum' ? 'Copied!' : `Copy Forum (${forumHandles.length})`}
        </button>
        <button
          onClick={() => copyHandles(discordHandles, 'discord')}
          disabled={discordHandles.length === 0}
          className="filter-label disabled:cursor-not-allowed disabled:opacity-60"
          title={`Copy ${discordHandles.length} discord handles to clipboard`}
        >
          {copiedType === 'discord' ? 'Copied!' : `Copy Discord (${discordHandles.length})`}
        </button>
      </div>
    </div>
  );
}
