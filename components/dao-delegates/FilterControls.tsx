'use client';

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
}: FilterControlsProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-4">
      {/* Search input */}
      <div className="flex-1 min-w-[240px]">
        <input
          type="text"
          placeholder="Search by name or address..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-2 font-body text-sm text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Search delegates"
        />
      </div>

      {/* Eligible only filter */}
      <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-body text-sm text-foreground transition-colors hover:bg-card-hover cursor-pointer">
        <input
          type="checkbox"
          checked={showEligibleOnly}
          onChange={(e) => onEligibleOnlyChange(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span>Eligible Only</span>
      </label>

      {/* Show withdrawn filter */}
      <label className={`flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-body text-sm transition-colors ${
        disableDependentFilters
          ? 'opacity-60 cursor-not-allowed'
          : 'text-foreground hover:bg-card-hover cursor-pointer'
      }`}>
        <input
          type="checkbox"
          checked={showWithdrawn}
          onChange={(e) => onShowWithdrawnChange(e.target.checked)}
          disabled={disableDependentFilters}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className={disableDependentFilters ? 'text-muted' : ''}>Show Withdrawn</span>
      </label>

      {/* Show changes only filter */}
      <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-body text-sm text-foreground transition-colors hover:bg-card-hover cursor-pointer">
        <input
          type="checkbox"
          checked={showChangesOnly}
          onChange={(e) => onShowChangesOnlyChange(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span>Changes Only</span>
      </label>

      {/* Show current delegates only filter */}
      <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-body text-sm text-foreground transition-colors hover:bg-card-hover cursor-pointer">
        <input
          type="checkbox"
          checked={showCurrentOnly}
          onChange={(e) => onShowCurrentOnlyChange(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span>Delegates Only</span>
      </label>

      {/* Show incomplete profile filter */}
      <label className={`flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-body text-sm transition-colors ${
        disableDependentFilters
          ? 'opacity-60 cursor-not-allowed'
          : 'text-foreground hover:bg-card-hover cursor-pointer'
      }`}>
        <input
          type="checkbox"
          checked={showIncompleteProfile}
          onChange={(e) => onShowIncompleteProfileChange(e.target.checked)}
          disabled={disableDependentFilters}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className={disableDependentFilters ? 'text-muted' : ''}>Show Incomplete Profiles</span>
      </label>
    </div>
  );
}
