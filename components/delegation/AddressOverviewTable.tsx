import CohortBadge from '@/components/dao-delegates/CohortBadge';
import ScoreCell from '@/components/dao-delegates/ScoreCell';
import type { OverviewAddress } from '@/lib/delegation/logic/address-overview';

import ClaimStatusBadge from './ClaimStatusBadge';
import OptOutStatusBadge from './OptOutStatusBadge';

export default function AddressOverviewTable({ addresses }: { addresses: OverviewAddress[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border bg-muted/10">
          <tr>
            <th className="table-col-header px-4 py-3 text-left">Address</th>
            <th className="table-col-header px-4 py-3 text-center">Rank</th>
            <th className="table-col-header px-4 py-3 text-center">Score</th>
            <th className="table-col-header px-4 py-3 text-left">Cohort</th>
            <th className="table-col-header px-4 py-3 text-left">Allocated Power</th>
            <th className="table-col-header px-4 py-3 text-left">Claim</th>
            <th className="table-col-header px-4 py-3 text-left">Opt-out</th>
          </tr>
        </thead>
        <tbody>
          {addresses.map((entry) => (
            <tr key={entry.address} className="transition-colors hover:bg-card-hover">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs text-foreground">{entry.address}</code>
                  {entry.isRequested && <span className="badge-sm-primary">Requested</span>}
                </div>
                {entry.ensName && <div className="mt-0.5 text-xs text-muted">{entry.ensName}</div>}
              </td>
              <td className="px-4 py-3 text-center font-medium text-foreground tabular-nums">
                {entry.rank ?? '-'}
              </td>
              <td className="px-4 py-3 text-center">
                <ScoreCell score={entry.score} />
              </td>
              <td className="px-4 py-3">
                <CohortBadge cohort={entry.cohort} />
              </td>
              <td className="px-4 py-3 text-foreground tabular-nums">
                {entry.allocatedPower !== null ? (
                  `${Math.round(entry.allocatedPower).toLocaleString()} SSV`
                ) : (
                  <span className="text-xs text-muted">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                <ClaimStatusBadge status={entry.claimStatus} />
              </td>
              <td className="px-4 py-3">
                <OptOutStatusBadge status={entry.optOut} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
