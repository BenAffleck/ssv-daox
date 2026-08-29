'use client';

import { useMemo } from 'react';

import type { SortDirection, SortField } from '@/components/dao-delegates/TableHeader';

import { booleanParam, enumParam, stringParam, useUrlState } from './useUrlState';

const SORT_FIELDS: readonly SortField[] = [
  'rank',
  'karmaScore',
  'votingPower',
  'delegatedTokens',
  'delegatorCount',
] as const;

const SORT_DIRECTIONS: readonly SortDirection[] = ['asc', 'desc'] as const;

function createDelegateFilterConfigs() {
  return {
    searchQuery: stringParam('q', ''),
    showEligibleOnly: booleanParam('eligible', false),
    showWithdrawn: booleanParam('withdrawn', false),
    showChangesOnly: booleanParam('changes', false),
    showIncompleteProfile: booleanParam('incomplete', false),
    showCurrentOnly: booleanParam('current', false),
    sortField: enumParam<SortField>('sort', 'rank', SORT_FIELDS),
    sortDirection: enumParam<SortDirection>('dir', 'asc', SORT_DIRECTIONS),
  };
}

export function useDelegateFilters() {
  const configs = useMemo(createDelegateFilterConfigs, []);
  return useUrlState(configs);
}
