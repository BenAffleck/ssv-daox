'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Delegate } from '@/lib/dao-delegates/types';
import { useDelegateFilters } from '@/lib/hooks/useDelegateFilters';
import FilterControls from './FilterControls';
import TableHeader, { SortField, SortDirection } from './TableHeader';
import DelegateRow from './DelegateRow';
import IncompleteProfileEmptyState from './IncompleteProfileEmptyState';

interface DelegatesTableProps {
  delegates: Delegate[];
}

export default function DelegatesTable({ delegates }: DelegatesTableProps) {
  const [filters, setFilter, setMultiple] = useDelegateFilters();
  const {
    searchQuery,
    showEligibleOnly,
    showWithdrawn,
    showChangesOnly,
    showIncompleteProfile,
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
    [setFilter]
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => clearTimeout(searchTimerRef.current);
  }, []);

  // Store previous state of dependent filters before "Changes Only" or "Current Only" is enabled
  const previousFiltersRef = useRef<{
    showWithdrawn: boolean;
    showIncompleteProfile: boolean;
    source: 'changesOnly' | 'currentOnly';
  } | null>(null);

  // When "Changes Only" or "Current Only" is checked, save current state and enable dependent filters
  // When unchecked, restore previous state
  useEffect(() => {
    const forcingFilter = showChangesOnly || showCurrentOnly;

    if (forcingFilter && previousFiltersRef.current === null) {
      // Save current state before forcing to true
      previousFiltersRef.current = {
        showWithdrawn,
        showIncompleteProfile,
        source: showChangesOnly ? 'changesOnly' : 'currentOnly',
      };
      setMultiple({ showWithdrawn: true, showIncompleteProfile: true });
    } else if (!forcingFilter && previousFiltersRef.current !== null) {
      // Restore previous state when both forcing filters are unchecked
      setMultiple({
        showWithdrawn: previousFiltersRef.current.showWithdrawn,
        showIncompleteProfile: previousFiltersRef.current.showIncompleteProfile,
      });
      previousFiltersRef.current = null;
    }
  }, [showChangesOnly, showCurrentOnly]);

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

    // Apply status filter (active by default, optionally show withdrawn)
    if (showWithdrawn) {
      // Show both active and withdrawn
      filtered = filtered.filter((d) =>
        d.status.toLowerCase() === 'active' || d.status.toLowerCase() === 'withdrawn'
      );
    } else {
      // Show only active
      filtered = filtered.filter((d) => d.status.toLowerCase() === 'active');
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.displayName.toLowerCase().includes(query) ||
          d.publicAddress.toLowerCase().includes(query) ||
          d.name.toLowerCase().includes(query) ||
          d.ensName.toLowerCase().includes(query)
      );
    }

    // Apply eligible only filter
    if (showEligibleOnly) {
      filtered = filtered.filter((d) => d.isEligible);
    }

    // Apply changes only filter (show only Delegate or Undelegate)
    if (showChangesOnly) {
      filtered = filtered.filter((d) => {
        const hasPrograms = d.delegationPrograms.length > 0;
        // Show if: (has programs but not delegated) OR (no programs but is delegated)
        return (hasPrograms && !d.isAlreadyDelegated) || (!hasPrograms && d.isAlreadyDelegated);
      });
    }

    // Apply current delegates only filter (show only delegates currently receiving delegation)
    if (showCurrentOnly) {
      filtered = filtered.filter((d) => d.isAlreadyDelegated);
    }

    // Apply incomplete profile filter (hide by default, show when checked)
    if (!showIncompleteProfile) {
      filtered = filtered.filter((d) => d.isProfileComplete);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortField) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'karmaScore':
          aValue = a.karmaScore;
          bValue = b.karmaScore;
          break;
        case 'votingPower':
          aValue = a.votingPowerData?.votingPower ?? 0;
          bValue = b.votingPowerData?.votingPower ?? 0;
          break;
        case 'delegatedTokens':
          aValue = a.delegatedTokens;
          bValue = b.delegatedTokens;
          break;
        case 'delegatorCount':
          aValue = a.delegatorCount;
          bValue = b.delegatorCount;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [delegates, searchQuery, showEligibleOnly, showWithdrawn, showChangesOnly, showCurrentOnly, showIncompleteProfile, sortField, sortDirection]);

  // Detect if the search matches a delegate with an incomplete profile that was filtered out
  const hiddenIncompleteDelegate = useMemo(() => {
    // Only check when no results, there's a search query, and incomplete profiles are hidden
    if (filteredDelegates.length > 0 || !searchQuery || showIncompleteProfile) {
      return null;
    }

    const query = searchQuery.toLowerCase();

    // Search through ALL delegates (before filtering) for incomplete profile match
    return (
      delegates.find(
        (d) =>
          !d.isProfileComplete &&
          d.status.toLowerCase() === 'active' &&
          (d.displayName.toLowerCase().includes(query) ||
            d.publicAddress.toLowerCase().includes(query) ||
            d.name.toLowerCase().includes(query) ||
            d.ensName.toLowerCase().includes(query))
      ) || null
    );
  }, [delegates, filteredDelegates.length, searchQuery, showIncompleteProfile]);

  // Collect non-empty handles from filtered delegates
  const forumHandles = useMemo(
    () => filteredDelegates.map((d) => d.forumHandle).filter(Boolean),
    [filteredDelegates]
  );
  const discordHandles = useMemo(
    () => filteredDelegates.map((d) => d.discordUsername).filter(Boolean),
    [filteredDelegates]
  );

  return (
    <div>
      <FilterControls
        searchQuery={searchInput}
        onSearchChange={handleSearchChange}
        showEligibleOnly={showEligibleOnly}
        onEligibleOnlyChange={setFilter.showEligibleOnly}
        showWithdrawn={showWithdrawn}
        onShowWithdrawnChange={setFilter.showWithdrawn}
        showChangesOnly={showChangesOnly}
        onShowChangesOnlyChange={setFilter.showChangesOnly}
        showIncompleteProfile={showIncompleteProfile}
        onShowIncompleteProfileChange={setFilter.showIncompleteProfile}
        showCurrentOnly={showCurrentOnly}
        onShowCurrentOnlyChange={setFilter.showCurrentOnly}
        disableDependentFilters={showChangesOnly || showCurrentOnly}
        forumHandles={forumHandles}
        discordHandles={discordHandles}
      />

      {filteredDelegates.length === 0 ? (
        hiddenIncompleteDelegate ? (
          <IncompleteProfileEmptyState
            delegate={hiddenIncompleteDelegate}
            onShowIncompleteProfiles={() => setFilter.showIncompleteProfile(true)}
          />
        ) : (
          <div className="card p-14 text-center">
            <p className="font-body text-[15px] text-muted">
              {searchQuery
                ? 'No delegates match your search'
                : showEligibleOnly
                ? 'No eligible delegates found'
                : 'No delegates found'}
            </p>
          </div>
        )
      ) : (
        <div className="overflow-x-auto card">
          <table className="w-full">
            <TableHeader
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <tbody>
              {filteredDelegates.map((delegate) => (
                <DelegateRow key={delegate.publicAddress} delegate={delegate} />
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
