'use client';

export type SortField = 'rank' | 'karmaScore' | 'delegatedTokens' | 'delegatorCount';
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
      <th className={`p-4 ${alignClass}`}>
        <button
          onClick={() => onSort(field)}
          className="inline-flex items-center gap-1 font-heading text-sm font-semibold text-foreground transition-colors hover:text-primary"
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
        <th className="p-4 text-left font-heading text-sm font-semibold text-foreground">
          Wallet Address
        </th>
        <th className="p-4 text-left font-heading text-sm font-semibold text-foreground">
          Name/ENS
        </th>
        <th className="p-4 text-left font-heading text-sm font-semibold text-foreground">
          Delegation Status
        </th>
        <th className="p-4 text-left font-heading text-sm font-semibold text-foreground">
          Eligibility
        </th>
        <th className="p-4 text-left font-heading text-sm font-semibold text-foreground">
          Programs
        </th>
        <th className="p-4 text-left font-heading text-sm font-semibold text-foreground">
          Profile
        </th>
        <th className="p-4 text-left font-heading text-sm font-semibold text-foreground">
          Voting Participation
        </th>
        <th className="p-4 text-left font-heading text-sm font-semibold text-foreground">
          Next Round
        </th>
      </tr>
    </thead>
  );
}
