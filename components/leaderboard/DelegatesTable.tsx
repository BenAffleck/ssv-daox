'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDelegateFilters } from '@/lib/hooks/useDelegateFilters';
import { PILLAR_LABELS } from '@/lib/leaderboard/config';
import { lookupTargetOf } from '@/lib/leaderboard/logic/address-lookup';
import { collectHandles } from '@/lib/leaderboard/logic/collect-handles';
import { DELEGATES_PAGE_SIZE, paginate } from '@/lib/leaderboard/logic/paginate';
import { Delegate, PillarKey } from '@/lib/leaderboard/types';

import AddressLookupLink from './AddressLookupLink';
import DelegateRow from './DelegateRow';
import FilterControls from './FilterControls';
import TableHeader, { SortDirection, SortField } from './TableHeader';
import TablePagination from './TablePagination';

interface DelegatesTableProps {
  delegates: Delegate[];
}

function sortValue(delegate: Delegate, field: SortField): number | null {
  switch (field) {
    case 'rank':
      return delegate.rank;
    case 'score':
      return delegate.score;
    case 'community':
    case 'holdings':
    case 'votes': {
      // A missing pillar is "n/a", not 0, so it sorts with the unscored rows
      const pillar = delegate.pillars[field];
      return pillar && !pillar.missing ? pillar.score : null;
    }
    case 'votingPower':
      return delegate.votingPowerData?.votingPower ?? 0;
    case 'allocatedPower':
      return delegate.currentPower;
  }
}

/** Sorts in the given direction; `null` values go last either way. */
function compareDelegates(
  a: Delegate,
  b: Delegate,
  field: SortField,
  direction: SortDirection,
): number {
  const aValue = sortValue(a, field);
  const bValue = sortValue(b, field);

  if (aValue === null || bValue === null) {
    return (aValue === null ? 1 : 0) - (bValue === null ? 1 : 0);
  }

  return direction === 'asc' ? aValue - bValue : bValue - aValue;
}

export default function DelegatesTable({ delegates }: DelegatesTableProps) {
  const [filters, setFilter, setMultiple] = useDelegateFilters();
  const { searchQuery, showChangesOnly, showCurrentOnly, sortField, sortDirection, page } = filters;

  // Debounced search: local state for input, synced to URL after delay
  const [searchInput, setSearchInput] = useState(searchQuery);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Values written to the URL whose echo hasn't arrived yet.
  const pendingEchoesRef = useRef(new Set<string>());
  const lastWrittenRef = useRef(searchQuery);

  // Sync local input on external URL changes (e.g., browser navigation), not on echoes of our own
  // writes: a late echo would overwrite what the user has typed since.
  useEffect(() => {
    if (pendingEchoesRef.current.has(searchQuery)) {
      if (searchQuery === lastWrittenRef.current) {
        pendingEchoesRef.current.clear();
      }
      return;
    }
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        pendingEchoesRef.current.add(value);
        lastWrittenRef.current = value;
        setMultiple({ searchQuery: value, page: 1 });
      }, 300);
    },
    [setMultiple],
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => clearTimeout(searchTimerRef.current);
  }, []);

  // Handle sort changes
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setMultiple({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc', page: 1 });
    } else {
      // Set new field with default direction
      setMultiple({
        sortField: field,
        sortDirection: field === 'rank' ? 'asc' : 'desc',
        page: 1,
      });
    }
  };

  // Filter and sort delegates
  const filteredDelegates = useMemo(() => {
    let filtered = [...delegates];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((d) =>
        [d.displayName, d.publicAddress, d.ensName, d.forumHandle, d.discordHandle].some((value) =>
          value?.toLowerCase().includes(query),
        ),
      );
    }

    // Apply changes only filter (show only Add or Remove)
    if (showChangesOnly) {
      filtered = filtered.filter((d) => (d.cohort !== null) !== d.isAlreadyDelegated);
    }

    // Apply current delegates only filter (show only delegates currently receiving delegation)
    if (showCurrentOnly) {
      filtered = filtered.filter((d) => d.isAlreadyDelegated);
    }

    filtered.sort((a, b) => compareDelegates(a, b, sortField, sortDirection));

    return filtered;
  }, [delegates, searchQuery, showChangesOnly, showCurrentOnly, sortField, sortDirection]);

  const lookupTarget = useMemo(
    () => lookupTargetOf(searchQuery, delegates),
    [searchQuery, delegates],
  );

  const visible = useMemo(
    () => paginate(filteredDelegates, page, DELEGATES_PAGE_SIZE),
    [filteredDelegates, page],
  );

  // A pillar that is null for everyone is not live in this run
  const livePillars = useMemo(
    () =>
      (Object.keys(PILLAR_LABELS) as PillarKey[]).filter((pillar) =>
        delegates.some((d) => d.pillars[pillar] !== null),
      ),
    [delegates],
  );

  const forumHandles = useMemo(
    () => collectHandles(filteredDelegates, 'forumHandle'),
    [filteredDelegates],
  );
  const discordHandles = useMemo(
    () => collectHandles(filteredDelegates, 'discordHandle'),
    [filteredDelegates],
  );

  return (
    <div>
      <FilterControls
        searchQuery={searchInput}
        onSearchChange={handleSearchChange}
        showChangesOnly={showChangesOnly}
        onShowChangesOnlyChange={(value) => setMultiple({ showChangesOnly: value, page: 1 })}
        showCurrentOnly={showCurrentOnly}
        onShowCurrentOnlyChange={(value) => setMultiple({ showCurrentOnly: value, page: 1 })}
        forumHandles={forumHandles}
        discordHandles={discordHandles}
      />

      {lookupTarget ? (
        <AddressLookupLink target={lookupTarget} />
      ) : (
        filteredDelegates.length === 0 && (
          <div className="card p-14 text-center">
            <p className="font-body text-[15px] text-muted">
              {searchQuery ? 'No delegates match your search' : 'No delegates found'}
            </p>
          </div>
        )
      )}

      {filteredDelegates.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <TableHeader
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              livePillars={livePillars}
            />
            <tbody>
              {visible.items.map((delegate) => (
                <DelegateRow
                  key={delegate.publicAddress}
                  delegate={delegate}
                  livePillars={livePillars}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TablePagination
        page={visible.page}
        totalPages={visible.totalPages}
        onPageChange={(next) => setFilter.page(next)}
      />

      <div className="mt-5 text-center text-[13px] text-muted">
        Showing {visible.items.length} of {filteredDelegates.length} matching · {delegates.length}{' '}
        delegates
      </div>
    </div>
  );
}
