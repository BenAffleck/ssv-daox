import AddressLookupForm from '@/components/delegation/AddressLookupForm';
import AddressOverviewTable from '@/components/delegation/AddressOverviewTable';
import ClaimWizard from '@/components/delegation/ClaimWizard';
import DelegationPanel from '@/components/delegation/DelegationPanel';
import OptOutPanel from '@/components/delegation/OptOutPanel';
import WalletPanel from '@/components/delegation/WalletPanel';
import { fetchLeaderboard, fetchScoreHealth } from '@/lib/dao-delegates/api/fetch-leaderboard';
import { DELEGATE_SCORE_CONFIG } from '@/lib/dao-delegates/config';
import { getHighSignalConfig } from '@/lib/delegation/config';
import {
  buildAddressOverview,
  isAddress,
  withOptOutStatuses,
  withSafeRequests,
  type AddressOverview,
} from '@/lib/delegation/logic/address-overview';
import { targetScoringOf, type TargetScoring } from '@/lib/delegation/logic/delegation-plan';
import {
  fetchOptOutStatuses,
  fetchSafeRequests,
  getOptOutService,
} from '@/lib/delegation/opt-out/server';
import { fetchVotingPower, type DelegationEntry } from '@/lib/gnosis';
import { getMainnetRpcUrl } from '@/lib/wallet/config';

export const revalidate = 300;

export const metadata = {
  title: 'Delegation - DAOx',
  description: 'Your scored addresses and their HighSignal identity siblings',
};

function PageHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h1 className="mb-2">Delegation</h1>
      <p className="text-[15px] text-muted">
        Check your score, then claim on HighSignal, opt out or delegate your voting power.
      </p>
      {children}
    </div>
  );
}

function WalletSection({
  address,
  overview,
}: {
  address: string;
  overview: AddressOverview | null;
}) {
  if (!getMainnetRpcUrl()) {
    return (
      <div role="status" className="card mt-6 p-4">
        <p className="text-[13px] text-muted">
          Wallet features are unavailable: MAINNET_RPC_URL is not configured.
        </p>
      </div>
    );
  }
  return (
    <WalletPanel
      selectedAddress={address}
      identityAddresses={overview?.addresses.map((a) => a.address) ?? []}
    />
  );
}

/** Returns `null` when the Gnosis API lookup fails. */
async function fetchOutgoingDelegations(address: string): Promise<DelegationEntry[] | null> {
  const votingPower = await fetchVotingPower([address]);
  return votingPower[address.toLowerCase()]?.outgoingDelegations ?? null;
}

async function DelegationSection({
  address,
  ownAddresses,
  scoring,
  step,
}: {
  address: string;
  ownAddresses: string[];
  scoring: TargetScoring;
  step?: number;
}) {
  if (!getMainnetRpcUrl()) {
    return null;
  }
  // Keyed so the form re-prefills when `?address=` changes.
  return (
    <DelegationPanel
      key={address.toLowerCase()}
      address={address}
      current={await fetchOutgoingDelegations(address)}
      ownAddresses={ownAddresses}
      scoring={scoring}
      step={step}
    />
  );
}

function emptyMessage(address: string): string {
  if (!address) {
    return 'Connect a wallet or enter an address to see its score and identity siblings.';
  }
  if (!isAddress(address)) {
    return `${address} is not an Ethereum address.`;
  }
  return `${address} is not in the latest Delegate Score run.`;
}

function EmptyState({ address }: { address: string }) {
  return (
    <div className="card-empty">
      <p className="font-body text-[15px] text-muted">{emptyMessage(address)}</p>
      <p className="mt-2 text-[13px] text-muted">
        You can also open any address from the DAO Delegates leaderboard.
      </p>
      <AddressLookupForm defaultValue={address} />
    </div>
  );
}

export default async function DelegationPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string | string[] }>;
}) {
  if (!DELEGATE_SCORE_CONFIG.apiBaseUrl) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <PageHeader />
        <div className="card-empty">
          <p className="font-body text-[15px] text-muted">
            Delegate data is unavailable: DELEGATE_SCORE_API_URL is not configured.
          </p>
        </div>
      </div>
    );
  }

  const { address: param } = await searchParams;
  const address = (Array.isArray(param) ? param[0] : param)?.trim() ?? '';

  if (!isAddress(address)) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <PageHeader>
          <WalletSection address={address} overview={null} />
        </PageHeader>
        <EmptyState address={address} />
      </div>
    );
  }

  const [leaderboard, health] = await Promise.all([fetchLeaderboard(), fetchScoreHealth()]);
  const baseOverview = buildAddressOverview(address, leaderboard.rows, getHighSignalConfig());
  const overviewAddresses = (baseOverview?.addresses ?? []).map((a) => a.address.toLowerCase());
  const [statuses, safeRequests] = await Promise.all([
    // One batch: the overview's unscored siblings and every leaderboard address, for target warnings.
    fetchOptOutStatuses([
      ...new Set([...overviewAddresses, ...leaderboard.rows.map((r) => r.address.toLowerCase())]),
    ]),
    fetchSafeRequests(overviewAddresses),
  ]);
  const overview =
    baseOverview && withSafeRequests(withOptOutStatuses(baseOverview, statuses), safeRequests);
  const scoring = targetScoringOf(leaderboard.rows, statuses);
  const ownAddresses = overview?.addresses.map((a) => a.address) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader>
        <p className="mt-2 text-[13px] text-muted">
          Scores from run {leaderboard.runId}, as of {leaderboard.asOf} (UTC).
        </p>
        <WalletSection address={address} overview={overview} />
      </PageHeader>
      {overview ? (
        <>
          <AddressOverviewTable addresses={overview.addresses} />
          <ClaimWizard
            addresses={overview.addresses}
            lastRunAsOf={health?.as_of ?? null}
            step={1}
          />
          <OptOutPanel
            addresses={overview.addresses}
            mode={getOptOutService().mode}
            signingAvailable={Boolean(getMainnetRpcUrl())}
            step={2}
          />
          <DelegationSection
            address={address}
            ownAddresses={ownAddresses}
            scoring={scoring}
            step={3}
          />
        </>
      ) : (
        <>
          <EmptyState address={address} />
          <DelegationSection address={address} ownAddresses={ownAddresses} scoring={scoring} />
        </>
      )}
    </div>
  );
}
