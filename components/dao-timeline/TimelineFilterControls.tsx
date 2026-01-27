'use client';

interface SourceOption {
  id: string;
  name: string;
}

interface TimelineFilterControlsProps {
  sources: SourceOption[];
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  showPastEvents: boolean;
  onShowPastEventsChange: (show: boolean) => void;
}

export default function TimelineFilterControls({
  sources,
  selectedSources,
  onSourcesChange,
  showPastEvents,
  onShowPastEventsChange,
}: TimelineFilterControlsProps) {
  const handleSourceToggle = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onSourcesChange(selectedSources.filter((id) => id !== sourceId));
    } else {
      onSourcesChange([...selectedSources, sourceId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSources.length === sources.length) {
      onSourcesChange([]);
    } else {
      onSourcesChange(sources.map((s) => s.id));
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      {/* Source filters */}
      {sources.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted">Sources:</span>
          <button
            onClick={handleSelectAll}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              selectedSources.length === 0 || selectedSources.length === sources.length
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:bg-card-hover'
            }`}
          >
            All
          </button>
          {sources.map((source) => (
            <button
              key={source.id}
              onClick={() => handleSourceToggle(source.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                selectedSources.includes(source.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground hover:bg-card-hover'
              }`}
            >
              {source.name}
            </button>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Show past events toggle */}
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-card-hover">
        <input
          type="checkbox"
          checked={showPastEvents}
          onChange={(e) => onShowPastEventsChange(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-foreground">Show Past Events</span>
      </label>
    </div>
  );
}
