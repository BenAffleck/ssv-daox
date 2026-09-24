'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PILLAR_LABELS } from '@/lib/dao-delegates/config';
import { collectHandles } from '@/lib/dao-delegates/logic/collect-handles';
import { Delegate, PillarKey } from '@/lib/dao-delegates/types';
import { useDelegateFilters } from '@/lib/hooks/useDelegateFilters';

import DelegateRow from './DelegateRow';
import FilterControls from './FilterControls';
import TableHeader, { SortDirection, SortField } from './TableHeader';

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
      return delegate.allocatedPower;
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
  const {
    searchQuery,
    showEligibleOnly,
    showChangesOnly,
    showCurrentOnly,
    sortField,
    sortDirection,
  } = filters;

  // Debounced search: local state for input, synced to URL after delay
  const [searchInput, setSearchInput] = useState(searchQuery);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync local input when URL param changes externally (e.g., browser navigation)
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setFilter.searchQuery(value);
      }, 300);
    },
    [setFilter],
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => clearTimeout(searchTimerRef.current);
  }, []);

  // Handle sort changes
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setFilter.sortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setMultiple({ sortField: field, sortDirection: field === 'rank' ? 'asc' : 'desc' });
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

    // Apply eligible only filter
    if (showEligibleOnly) {
      filtered = filtered.filter((d) => d.isEligible);
    }

    // Apply changes only filter (show only Delegate or Undelegate)
    if (showChangesOnly) {
      filtered = filtered.filter((d) => (d.cohort !== null) !== d.isAlreadyDelegated);
    }

    // Apply current delegates only filter (show only delegates currently receiving delegation)
    if (showCurrentOnly) {
      filtered = filtered.filter((d) => d.isAlreadyDelegated);
    }

    filtered.sort((a, b) => compareDelegates(a, b, sortField, sortDirection));

    return filtered;
  }, [
    delegates,
    searchQuery,
    showEligibleOnly,
    showChangesOnly,
    showCurrentOnly,
    sortField,
    sortDirection,
  ]);

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
        showEligibleOnly={showEligibleOnly}
        onEligibleOnlyChange={setFilter.showEligibleOnly}
        showChangesOnly={showChangesOnly}
        onShowChangesOnlyChange={setFilter.showChangesOnly}
        showCurrentOnly={showCurrentOnly}
        onShowCurrentOnlyChange={setFilter.showCurrentOnly}
        forumHandles={forumHandles}
        discordHandles={discordHandles}
      />

      {filteredDelegates.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="font-body text-[15px] text-muted">
            {searchQuery
              ? 'No delegates match your search'
              : showEligibleOnly
                ? 'No eligible delegates found'
                : 'No delegates found'}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <TableHeader
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              livePillars={livePillars}
            />
            <tbody>
              {filteredDelegates.map((delegate) => (
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

      <div className="mt-5 text-center text-[13px] text-muted">
        Showing {filteredDelegates.length} of {delegates.length} delegates
      </div>
    </div>
  );
}
