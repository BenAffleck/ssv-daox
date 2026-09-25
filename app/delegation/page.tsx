import AddressLookupForm from '@/components/delegation/AddressLookupForm';
import AddressOverviewTable from '@/components/delegation/AddressOverviewTable';
import WalletPanel from '@/components/delegation/WalletPanel';
import { fetchLeaderboard } from '@/lib/dao-delegates/api/fetch-leaderboard';
import { DELEGATE_SCORE_CONFIG } from '@/lib/dao-delegates/config';
import {
  buildAddressOverview,
  isAddress,
  type AddressOverview,
} from '@/lib/delegation/logic/address-overview';
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
        An address and every sibling address in its HighSignal identity, with score and claim status
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

  const leaderboard = await fetchLeaderboard();
  const overview = buildAddressOverview(address, leaderboard.rows);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader>
        <p className="mt-2 text-[13px] text-muted">
          Scores from run {leaderboard.runId}, as of {leaderboard.asOf} (UTC).
        </p>
        <WalletSection address={address} overview={overview} />
      </PageHeader>
      {overview ? (
        <AddressOverviewTable addresses={overview.addresses} />
      ) : (
        <EmptyState address={address} />
      )}
    </div>
  );
}
