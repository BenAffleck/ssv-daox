'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

interface VoteSearchInputProps {
  /** Current committed query (from the URL). */
  value: string;
  /** Called after the debounce interval with the new query. */
  onChange: (value: string) => void;
}

const DEBOUNCE_MS = 300;

/**
 * Debounced text search over the vote list.
 *
 * Local state keeps typing responsive; the committed value lands in the URL
 * after a pause, matching the delegates table's search behaviour.
 */
export default function VoteSearchInput({ value, onChange }: VoteSearchInputProps) {
  const [input, setInput] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync local input when the URL param changes externally (browser back/forward).
  useEffect(() => {
    setInput(value);
  }, [value]);

  const handleChange = useCallback(
    (next: string) => {
      setInput(next);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(next), DEBOUNCE_MS);
    },
    [onChange]
  );

  const clear = useCallback(() => {
    setInput('');
    clearTimeout(timerRef.current);
    onChange('');
  }, [onChange]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="relative">
      <Search
        size={14}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search votes by title or content…"
        aria-label="Search votes"
        className="filter-input pl-9 pr-9"
      />
      {input.length > 0 && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
