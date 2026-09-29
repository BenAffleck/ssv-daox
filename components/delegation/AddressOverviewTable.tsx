import CohortBadge from '@/components/dao-delegates/CohortBadge';
import DelegationStatusBadge from '@/components/dao-delegates/DelegationStatusBadge';
import ScoreCell from '@/components/dao-delegates/ScoreCell';
import VotingPowerBadge from '@/components/dao-delegates/VotingPowerBadge';
import type { OverviewAddress } from '@/lib/delegation/logic/address-overview';
import { sameAddress } from '@/lib/delegation/logic/pool';
import type { VotingPowerData } from '@/lib/gnosis/types';

import ClaimStatusBadge from './ClaimStatusBadge';
import OptOutStatusBadge from './OptOutStatusBadge';

interface AddressOverviewTableProps {
  addresses: OverviewAddress[];
  /** Addresses the DAO currently delegates to, lowercase. */
  delegatedAddresses: Set<string>;
  /** The requested address's voting power; siblings load theirs on demand. */
  selectedPin: VotingPowerData | null;
}

export default function AddressOverviewTable({
  addresses,
  delegatedAddresses,
  selectedPin,
}: AddressOverviewTableProps) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border bg-muted/10">
          <tr>
            <th className="table-col-header px-4 py-3 text-left">Address</th>
            <th className="table-col-header px-4 py-3 text-center">Rank</th>
            <th className="table-col-header px-4 py-3 text-center">Score</th>
            <th className="table-col-header px-4 py-3 text-left">Voting Power</th>
            <th className="table-col-header px-4 py-3 text-left">Cohort</th>
            <th className="table-col-header px-4 py-3 text-left">Delegation Status</th>
            <th className="table-col-header px-4 py-3 text-left">DAO Delegated Power</th>
            <th className="table-col-header px-4 py-3 text-left">HighSignal Status</th>
            <th className="table-col-header px-4 py-3 text-left">Opt-out</th>
          </tr>
        </thead>
        <tbody>
          {addresses.map((entry) => (
            <tr key={entry.address} className="transition-colors hover:bg-card-hover">
              <td className="px-4 py-3">
                <code className="font-mono text-xs text-foreground">{entry.address}</code>
                {entry.ensName && <div className="mt-0.5 text-xs text-muted">{entry.ensName}</div>}
              </td>
              <td className="px-4 py-3 text-center font-medium text-foreground tabular-nums">
                {entry.rank ?? '-'}
              </td>
              <td className="px-4 py-3 text-center">
                <ScoreCell score={entry.score} />
              </td>
              <td className="px-4 py-3">
                <VotingPowerBadge
                  votingPowerData={
                    sameAddress(entry.address, addresses[0].address) ? selectedPin : null
                  }
                  address={entry.address}
                />
              </td>
              <td className="px-4 py-3">
                <CohortBadge cohort={entry.cohort} />
              </td>
              <td className="px-4 py-3">
                <DelegationStatusBadge
                  isAlreadyDelegated={delegatedAddresses.has(entry.address.toLowerCase())}
                  hasCohort={entry.cohort !== null}
                />
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
