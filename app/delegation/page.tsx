import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Trophy } from 'lucide-react';

import AddressLookupForm from '@/components/delegation/AddressLookupForm';
import AddressOverviewTable from '@/components/delegation/AddressOverviewTable';
import AutoDelegationPath from '@/components/delegation/AutoDelegationPath';
import ClaimIntroPanel from '@/components/delegation/ClaimIntroPanel';
import ClaimWizard from '@/components/delegation/ClaimWizard';
import DelegateProfile from '@/components/delegation/DelegateProfile';
import DelegateToDaoPanel from '@/components/delegation/DelegateToDaoPanel';
import DelegationPanel from '@/components/delegation/DelegationPanel';
import ManageDelegationPreview from '@/components/delegation/ManageDelegationPreview';
import OptOutPanel, { OptOutNotATarget } from '@/components/delegation/OptOutPanel';
import OwnerOnly from '@/components/delegation/OwnerOnly';
import ScoreBreakdownPanel from '@/components/delegation/ScoreBreakdownPanel';
import VotingPowerPanel from '@/components/delegation/VotingPowerPanel';
import WalletPanel from '@/components/delegation/WalletPanel';
import { fetchLeaderboard } from '@/lib/dao-delegates/api/fetch-leaderboard';
import { DELEGATE_SCORE_CONFIG } from '@/lib/dao-delegates/config';
import { scoreBreakdownOf } from '@/lib/dao-delegates/logic/score-breakdown';
import type { ScoreRow } from '@/lib/dao-delegates/types';
import { formatAddress } from '@/lib/dao-delegates/utils/address';
import { fetchPin, fetchPoolRecipients } from '@/lib/delegation/api/fetch-pin';
import { resolveEnsName, type EnsResolution } from '@/lib/delegation/api/resolve-ens';
import { AUTO_DELEGATION_POOL_ADDRESS, getHighSignalConfig } from '@/lib/delegation/config';
import {
  buildAddressOverview,
  isAddress,
  withOptOutStatuses,
  withSafeRequests,
  type AddressOverview,
} from '@/lib/delegation/logic/address-overview';
import { autoDelegationView } from '@/lib/delegation/logic/auto-delegation';
import { delegateOptionsOf, type DelegateOption } from '@/lib/delegation/logic/delegate-search';
import { targetScoringOf, type TargetScoring } from '@/lib/delegation/logic/delegation-plan';
import { normalizedEnsName } from '@/lib/delegation/logic/ens';
import { sameAddress } from '@/lib/delegation/logic/pool';
import {
  fetchOptOutStatuses,
  fetchSafeRequests,
  getOptOutService,
} from '@/lib/delegation/opt-out/server';
import type { DelegationEntry } from '@/lib/gnosis';
import {
  fetchSnapshotProfile,
  snapshotAvatarUrl,
  snapshotProfileUrl,
} from '@/lib/snapshot/api/fetch-profile';
import { getMainnetRpcUrl } from '@/lib/wallet/config';

export const revalidate = 300;

export const metadata = {
  title: 'Delegation - DAOx',
  description: 'Delegate scores, voting power and delegation for SSV governance',
};

function PageHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="mb-2">Delegation</h1>
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

function DelegationSection({
  address,
  current,
  ownAddresses,
  scoring,
  rows,
}: {
  address: string;
  current: DelegationEntry[] | null;
  ownAddresses: string[];
  scoring: TargetScoring;
  rows: ScoreRow[];
}) {
  if (!getMainnetRpcUrl()) {
    return null;
  }
  // Keyed so the form re-prefills when `?address=` changes.
  return (
    <DelegationPanel
      key={address.toLowerCase()}
      address={address}
      current={current}
      ownAddresses={ownAddresses}
      scoring={scoring}
      delegates={delegateOptionsOf(rows, scoring)}
    />
  );
}

function lookupProblem(resolution: EnsResolution | null): string {
  switch (resolution?.status) {
    case 'not_found':
      return 'does not resolve to an address.';
    case 'unavailable':
      return 'could not be resolved. ENS lookup is unavailable; enter the 0x address.';
    default:
      return 'is not an Ethereum address or ENS name.';
  }
}

function LookupCard({
  address,
  resolution,
  delegates,
}: {
  address: string;
  resolution: EnsResolution | null;
  delegates: DelegateOption[];
}) {
  return (
    <div className="card-empty">
      <p className="font-body text-[15px] text-foreground">
        {address ? (
          <>
            <code className="font-mono text-[13px]">{address}</code> {lookupProblem(resolution)}
          </>
        ) : (
          'Look up an address'
        )}
      </p>
      <AddressLookupForm defaultValue={address} delegates={delegates} />
      <p className="mt-4 text-[13px] text-muted">
        Or pick one from the{' '}
        <Link href="/delegates" className="text-primary hover:underline">
          DAO Delegates
        </Link>{' '}
        leaderboard.
      </p>
    </div>
  );
}

function NotScored() {
  return (
    <div role="status" className="flex items-start gap-3 rounded-lg border border-border p-4">
      <Trophy size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden />
      <div>
        <p className="text-[13px] font-medium text-foreground">Not on the leaderboard yet</p>
        <p className="mt-0.5 text-[13px] text-muted">
          This address isn&apos;t in the latest score run. Link it on HighSignal and share it with
          the SSV project to get a rank and a shot at a cohort seat. It shows up after the next
          score run.
        </p>
      </div>
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
    const ensName = normalizedEnsName(address);
    const resolution = ensName ? await resolveEnsName(ensName) : null;
    if (resolution?.status === 'resolved') {
      redirect(`/delegation?address=${resolution.address}`);
    }
    const { rows } = await fetchLeaderboard();
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <PageHeader>
          <WalletSection address={address} overview={null} />
        </PageHeader>
        <LookupCard
          address={address}
          resolution={resolution}
          delegates={delegateOptionsOf(rows, targetScoringOf(rows, {}))}
        />
      </div>
    );
  }

  const selected = address.toLowerCase();
  // The opt-out lookups need only the leaderboard, so they don't wait for the pin or profile.
  const scoreContext = fetchLeaderboard().then(async (leaderboard) => {
    const baseOverview = buildAddressOverview(address, leaderboard.rows, getHighSignalConfig());
    const overviewAddresses = (baseOverview?.addresses ?? []).map((a) => a.address.toLowerCase());
    const [statuses, safeRequests] = await Promise.all([
      // One batch: the selected address (loop guard), the overview's unscored siblings and every
      // leaderboard address (target warnings).
      fetchOptOutStatuses([
        ...new Set([
          selected,
          ...overviewAddresses,
          ...leaderboard.rows.map((r) => r.address.toLowerCase()),
        ]),
      ]),
      fetchSafeRequests(overviewAddresses),
    ]);
    return { leaderboard, baseOverview, statuses, safeRequests };
  });
  const [
    { leaderboard, baseOverview, statuses, safeRequests },
    pin,
    profile,
    delegationRecipients,
  ] = await Promise.all([
    scoreContext,
    fetchPin(address),
    fetchSnapshotProfile(address),
    fetchPoolRecipients(),
  ]);
  const overview =
    baseOverview && withSafeRequests(withOptOutStatuses(baseOverview, statuses), safeRequests);
  const scoring = targetScoringOf(leaderboard.rows, statuses);
  const scoreBreakdown = scoreBreakdownOf(
    leaderboard.rows.find((r) => sameAddress(r.address, address)),
    leaderboard.rows,
  );
  const ownAddresses = overview?.addresses.map((a) => a.address) ?? [];
  const requested = overview?.addresses[0] ?? null;
  const name =
    leaderboard.rows.find((r) => sameAddress(r.address, address))?.display_name ??
    profile?.name ??
    requested?.ensName ??
    formatAddress(address);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader>
        <WalletSection address={address} overview={overview} />
      </PageHeader>
      <DelegateProfile
        address={address}
        name={name}
        avatarUrl={snapshotAvatarUrl(address)}
        profileUrl={snapshotProfileUrl(address)}
        highSignalProfileUrl={requested?.highSignal.profileUrl ?? null}
        statement={profile?.statement ?? null}
      />
      {overview ? (
        <AddressOverviewTable
          addresses={overview.addresses}
          delegatedAddresses={new Set(delegationRecipients)}
          selectedPin={pin}
        />
      ) : (
        <NotScored />
      )}
      {getMainnetRpcUrl() ? (
        <AutoDelegationPath
          address={address}
          identityAddresses={ownAddresses}
          pin={pin}
          poolAddress={AUTO_DELEGATION_POOL_ADDRESS}
          optOut={statuses[selected] ?? null}
          optOutStepAvailable={overview !== null}
          nextPower={leaderboard.rows.find((r) => sameAddress(r.address, address))?.power ?? null}
        />
      ) : (
        <DelegateToDaoPanel />
      )}
      {scoreBreakdown && <ScoreBreakdownPanel breakdown={scoreBreakdown} />}
      <VotingPowerPanel
        breakdown={
          autoDelegationView({
            address,
            connected: undefined,
            pin,
            poolAddress: AUTO_DELEGATION_POOL_ADDRESS,
            optOut: null,
          }).breakdown
        }
      />
      <OwnerOnly address={address} fallback={<ManageDelegationPreview />}>
        <section aria-labelledby="manage-title" className="mt-10">
          <h2 id="manage-title">Manage Delegation</h2>
          {overview ? (
            <ClaimWizard addresses={overview.addresses} />
          ) : (
            <ClaimIntroPanel projectUrl={getHighSignalConfig().projectUrl} />
          )}
          {overview ? (
            <OptOutPanel
              addresses={overview.addresses}
              targetAddresses={delegationRecipients}
              mode={getOptOutService().mode}
              signingAvailable={Boolean(getMainnetRpcUrl())}
            />
          ) : (
            <OptOutNotATarget />
          )}
          <DelegationSection
            address={address}
            current={pin?.outgoingDelegations ?? null}
            ownAddresses={ownAddresses}
            scoring={scoring}
            rows={leaderboard.rows}
          />
        </section>
      </OwnerOnly>
      <p className="mt-10 text-right text-[12px] text-muted">
        Live mainnet data. Scores as of {leaderboard.asOf} UTC.
      </p>
    </div>
  );
}
