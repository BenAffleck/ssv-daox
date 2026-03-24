'use client';

export type SortField = 'rank' | 'karmaScore' | 'votingPower' | 'delegatedTokens' | 'delegatorCount';
export type SortDirection = 'asc' | 'desc';

interface TableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export default function TableHeader({
  sortField,
  sortDirection,
  onSort,
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
          className="inline-flex items-center gap-1 table-col-header transition-colors hover:text-primary"
        >
          {children}
          {isActive && (
            <span className="text-primary">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
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
        <SortableHeader field="karmaScore" align="center">
          Score
        </SortableHeader>
        <SortableHeader field="votingPower">
          Voting Power
        </SortableHeader>
        <th className="px-4 py-3 text-left table-col-header">
          Wallet Address
        </th>
        <th className="px-4 py-3 text-left table-col-header">
          Name/ENS
        </th>
        <th className="px-4 py-3 text-left table-col-header">
          Delegation Status
        </th>
        <th className="px-4 py-3 text-left table-col-header">
          Eligibility
        </th>
        <th className="px-4 py-3 text-left table-col-header">
          Programs
        </th>
        <th className="px-4 py-3 text-left table-col-header">
          Profile
        </th>
        <th className="px-4 py-3 text-left table-col-header">
          <div>Vote Activity</div>
          <div className="text-[10px] font-normal normal-case tracking-normal text-muted/70">Last 5 closed</div>
        </th>
        <th className="px-4 py-3 text-left table-col-header">
          Next Round
        </th>
      </tr>
    </thead>
  );
}
