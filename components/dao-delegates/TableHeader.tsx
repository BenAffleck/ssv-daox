'use client';

import { PILLAR_LABELS } from '@/lib/dao-delegates/config';
import type { PillarKey } from '@/lib/dao-delegates/types';

export type SortField = 'rank' | 'score' | PillarKey | 'votingPower' | 'allocatedPower';
export type SortDirection = 'asc' | 'desc';

interface TableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  livePillars: PillarKey[];
}

export default function TableHeader({
  sortField,
  sortDirection,
  onSort,
  livePillars,
}: TableHeaderProps) {
  const SortableHeader = ({
    field,
    children,
    align = 'left',
  }: {
    field: SortField;
    children: React.ReactNode;
    align?: 'left' | 'center';
  }) => {
    const isActive = sortField === field;
    const alignClass = align === 'center' ? 'text-center' : 'text-left';

    return (
      <th className={`px-4 py-3 ${alignClass}`}>
        <button
          onClick={() => onSort(field)}
          className="table-col-header inline-flex items-center gap-1 transition-colors hover:text-primary"
        >
          {children}
          {isActive && <span className="text-primary">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
        </button>
      </th>
    );
  };

  return (
    <thead className="border-b border-border bg-muted/10">
      <tr>
        <SortableHeader field="rank" align="center">
          Rank
        </SortableHeader>
        <th className="table-col-header px-4 py-3 text-left">Name</th>
        <SortableHeader field="score" align="center">
          Score
        </SortableHeader>
        {livePillars.map((pillar) => (
          <SortableHeader key={pillar} field={pillar} align="center">
            {PILLAR_LABELS[pillar]}
          </SortableHeader>
        ))}
        <SortableHeader field="votingPower">Voting Power</SortableHeader>
        <th className="table-col-header px-4 py-3 text-left">Wallet Address</th>
        <th className="table-col-header px-4 py-3 text-left">Delegation Status</th>
        <th className="table-col-header px-4 py-3 text-left">Eligibility</th>
        <th className="table-col-header px-4 py-3 text-left">Cohort</th>
        <SortableHeader field="allocatedPower">Allocated Power</SortableHeader>
        <th className="table-col-header px-4 py-3 text-left">
          <div>Vote Activity</div>
          <div className="text-[10px] font-normal tracking-normal text-muted/70 normal-case">
            Last 5 closed
          </div>
        </th>
        <th className="table-col-header px-4 py-3 text-left">Next Round</th>
      </tr>
    </thead>
  );
}
