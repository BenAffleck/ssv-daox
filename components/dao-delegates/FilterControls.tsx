'use client';

import { useState, useCallback } from 'react';

interface FilterControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showEligibleOnly: boolean;
  onEligibleOnlyChange: (value: boolean) => void;
  showWithdrawn: boolean;
  onShowWithdrawnChange: (value: boolean) => void;
  showChangesOnly: boolean;
  onShowChangesOnlyChange: (value: boolean) => void;
  showIncompleteProfile: boolean;
  onShowIncompleteProfileChange: (value: boolean) => void;
  showCurrentOnly: boolean;
  onShowCurrentOnlyChange: (value: boolean) => void;
  disableDependentFilters: boolean;
  forumHandles: string[];
  discordHandles: string[];
}

export default function FilterControls({
  searchQuery,
  onSearchChange,
  showEligibleOnly,
  onEligibleOnlyChange,
  showWithdrawn,
  onShowWithdrawnChange,
  showChangesOnly,
  onShowChangesOnlyChange,
  showIncompleteProfile,
  onShowIncompleteProfileChange,
  showCurrentOnly,
  onShowCurrentOnlyChange,
  disableDependentFilters,
  forumHandles,
  discordHandles,
}: FilterControlsProps) {
  const [copiedType, setCopiedType] = useState<'forum' | 'discord' | null>(null);

  const copyHandles = useCallback(async (handles: string[], type: 'forum' | 'discord') => {
    const text = handles.map((h) => h.startsWith('@') ? h : `@${h}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  }, []);

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="flex-1 min-w-[240px]">
        <input
          type="text"
          placeholder="Search by name or address..."
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

      {/* Show withdrawn filter */}
      <label className={disableDependentFilters ? 'filter-label-disabled' : 'filter-label'}>
        <input
          type="checkbox"
          checked={showWithdrawn}
          onChange={(e) => onShowWithdrawnChange(e.target.checked)}
          disabled={disableDependentFilters}
          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span>Show Withdrawn</span>
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

      {/* Show incomplete profile filter */}
      <label className={disableDependentFilters ? 'filter-label-disabled' : 'filter-label'}>
        <input
          type="checkbox"
          checked={showIncompleteProfile}
          onChange={(e) => onShowIncompleteProfileChange(e.target.checked)}
          disabled={disableDependentFilters}
          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span>Show Incomplete Profiles</span>
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
