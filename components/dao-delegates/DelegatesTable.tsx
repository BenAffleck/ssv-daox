'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Delegate } from '@/lib/dao-delegates/types';
import FilterControls from './FilterControls';
import TableHeader, { SortField, SortDirection } from './TableHeader';
import DelegateRow from './DelegateRow';

interface DelegatesTableProps {
  delegates: Delegate[];
}

export default function DelegatesTable({ delegates }: DelegatesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const [showChangesOnly, setShowChangesOnly] = useState(false);
  const [showIncompleteProfile, setShowIncompleteProfile] = useState(false);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Store previous state of dependent filters before "Changes Only" is enabled
  const previousFiltersRef = useRef<{
    showWithdrawn: boolean;
    showIncompleteProfile: boolean;
  } | null>(null);

  // When "Changes Only" is checked, save current state and enable dependent filters
  // When unchecked, restore previous state
  useEffect(() => {
    if (showChangesOnly) {
      // Save current state before forcing to true
      previousFiltersRef.current = {
        showWithdrawn,
        showIncompleteProfile,
      };
      setShowWithdrawn(true);
      setShowIncompleteProfile(true);
    } else if (previousFiltersRef.current !== null) {
      // Restore previous state when unchecking "Changes Only"
      setShowWithdrawn(previousFiltersRef.current.showWithdrawn);
      setShowIncompleteProfile(previousFiltersRef.current.showIncompleteProfile);
      previousFiltersRef.current = null;
    }
  }, [showChangesOnly]);

  // Handle sort changes
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setSortField(field);
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
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
  }, [delegates, searchQuery, showEligibleOnly, showWithdrawn, showChangesOnly, showIncompleteProfile, sortField, sortDirection]);

  return (
    <div>
      <FilterControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showEligibleOnly={showEligibleOnly}
        onEligibleOnlyChange={setShowEligibleOnly}
        showWithdrawn={showWithdrawn}
        onShowWithdrawnChange={setShowWithdrawn}
        showChangesOnly={showChangesOnly}
        onShowChangesOnlyChange={setShowChangesOnly}
        showIncompleteProfile={showIncompleteProfile}
        onShowIncompleteProfileChange={setShowIncompleteProfile}
        disableDependentFilters={showChangesOnly}
      />

      {filteredDelegates.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="font-body text-muted">
            {searchQuery
              ? 'No delegates match your search'
              : showEligibleOnly
              ? 'No eligible delegates found'
              : 'No delegates found'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
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

      <div className="mt-4 text-center text-sm text-muted">
        Showing {filteredDelegates.length} of {delegates.length} delegates
      </div>
    </div>
  );
}
