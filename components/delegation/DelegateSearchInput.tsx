'use client';

import { useId, useState, type KeyboardEvent } from 'react';

import { formatAddress } from '@/lib/dao-delegates/utils/address';
import { searchDelegates, type DelegateOption } from '@/lib/delegation/logic/delegate-search';
import { sameAddress } from '@/lib/delegation/logic/pool';

interface DelegateSearchInputProps {
  id?: string;
  'aria-label'?: string;
  value: string;
  onChange: (value: string) => void;
  options: DelegateOption[];
  className?: string;
}

function findSelected(options: DelegateOption[], value: string): DelegateOption | undefined {
  return options.find((o) => sameAddress(o.address, value.trim()));
}

/** Names the scored delegate an input holds. */
export function SelectedDelegate({ value, options }: { value: string; options: DelegateOption[] }) {
  const selected = findSelected(options, value);
  if (!selected) {
    return null;
  }
  return (
    <p className="text-[13px] text-muted">
      {selected.name} · rank #{selected.rank}
    </p>
  );
}

/** A free-text address or ENS input that also suggests scored delegates. */
export default function DelegateSearchInput({
  id,
  'aria-label': ariaLabel,
  value,
  onChange,
  options,
  className = '',
}: DelegateSearchInputProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = findSelected(options, value) ? [] : searchDelegates(options, value);
  const expanded = open && matches.length > 0;

  function choose(option: DelegateOption) {
    onChange(option.address);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!expanded) {
        setOpen(true);
        setActive(0);
        return;
      }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((active + step + matches.length) % matches.length);
      return;
    }
    if (e.key === 'Enter' && expanded) {
      e.preventDefault();
      choose(matches[Math.min(active, matches.length - 1)]);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded ? `${listId}-${active}` : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Search delegates, or 0x… / name.eth"
        className="filter-input w-full font-mono"
        autoComplete="off"
        spellCheck={false}
      />
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-card p-1"
        >
          {matches.map((o, i) => (
            <li
              key={o.address}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // Keeps focus in the input so blur doesn't close the list before the click lands.
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(o)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-[13px] ${
                i === active ? 'bg-card-hover text-primary' : 'text-foreground'
              }`}
            >
              <span className="min-w-0 truncate">
                {o.name}
                <span className="ml-2 font-mono text-xs text-muted">
                  {o.ensName ?? formatAddress(o.address)}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted">#{o.rank}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
