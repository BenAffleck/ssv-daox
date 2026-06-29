'use client';

export const ALL_VALUE = '__all__';

export interface FilterChipItem {
  key: string;
  label: string;
  /** Optional leading color-dot class (e.g. 'bg-primary') to tie the chip to its content. */
  dotClass?: string;
}

interface FilterChipsProps {
  items: FilterChipItem[];
  /** Currently selected key, or ALL_VALUE for "all". */
  value: string;
  onChange: (value: string) => void;
  /** Label for the "all" chip (default "All"). */
  allLabel?: string;
  /** Accessible label for the chip group. */
  ariaLabel?: string;
}

/**
 * Single-select chip filter: either "All" or exactly one item is selected.
 * Clicking an item selects only that item; clicking "All" resets to everything.
 */
export default function FilterChips({
  items,
  value,
  onChange,
  allLabel = 'All',
  ariaLabel,
}: FilterChipsProps) {
  const renderChip = (key: string, label: string, dotClass?: string) => {
    const active = value === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        aria-pressed={active}
        className={`inline-flex items-center gap-1.5 ${active ? 'filter-btn-active' : 'filter-btn'}`}
      >
        {dotClass && (
          <span className={`inline-block h-2 w-2 rounded-full ${dotClass} ${active ? '' : 'opacity-40'}`} />
        )}
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={ariaLabel}>
      {renderChip(ALL_VALUE, allLabel)}
      {items.map((item) => renderChip(item.key, item.label, item.dotClass))}
    </div>
  );
}
