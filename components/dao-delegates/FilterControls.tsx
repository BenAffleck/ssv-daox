'use client';

interface FilterControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showEligibleOnly: boolean;
  onEligibleOnlyChange: (value: boolean) => void;
  showChangesOnly: boolean;
  onShowChangesOnlyChange: (value: boolean) => void;
  showCurrentOnly: boolean;
  onShowCurrentOnlyChange: (value: boolean) => void;
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
}: FilterControlsProps) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="min-w-[240px] flex-1">
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
    </div>
  );
}
