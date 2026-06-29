'use client';

export type StatusValue = 'all' | 'active' | 'pending' | 'closed';

const OPTIONS: { value: StatusValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Upcoming' },
  { value: 'closed', label: 'Past' },
];

interface StatusFilterProps {
  value: StatusValue;
  onChange: (value: StatusValue) => void;
}

/**
 * Single-select segmented control for the vote lifecycle. Reads as a view
 * switcher (one option highlighted), distinct from the multi-select space chips.
 */
export default function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter by vote status"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted hover:bg-card-hover hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
