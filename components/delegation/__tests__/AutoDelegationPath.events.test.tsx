import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { track } from '@vercel/analytics';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletSession } from '@/components/wallet/useWalletSession';
import type { VotingPowerData } from '@/lib/gnosis/types';

import AutoDelegationPath from '../AutoDelegationPath';
import type { Submission, SubmissionPhase } from '../DelegationTransaction';

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
vi.mock('@/lib/leaderboard/api/load-status', () => ({ loadScoreStatus: async () => null }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const VIEWED = '0x1111111111111111111111111111111111111111';
const STRANGER = '0x3333333333333333333333333333333333333333';
const POOL = '0x9a62c932F5a8Eb807F655E3D948EdaE174D39D3B';
const HASH = `0x${'ab'.repeat(32)}` as const;

let session: WalletSession = { phase: 'disconnected', address: undefined };
vi.mock('@/components/wallet/useWalletSession', () => ({ useWalletSession: () => session }));

let connectModalOpen = false;
vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({
    openConnectModal: () => {
      connectModalOpen = true;
    },
    connectModalOpen,
  }),
}));

// The wallet's side of the write: what was sent and where it stands.
const write = vi.hoisted(() => ({
  submission: null as Submission | null,
  phase: 'idle' as SubmissionPhase,
  send: vi.fn(),
}));
vi.mock('../DelegationTransaction', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../DelegationTransaction')>()),
  useDelegationWrite: () => ({
    send: write.send,
    submission: write.submission,
    resetSubmission: vi.fn(),
    awaitingWallet: false,
  }),
  useSubmissionPhase: () => write.phase,
  DropConfirmation: () => null,
  SubmissionStatus: () => null,
}));

let gaveUp = false;
vi.mock('../useRefreshWhile', () => ({ useRefreshWhile: () => gaveUp, STILL_INDEXING_NOTE: '' }));

const PIN: VotingPowerData = {
  votingPower: 1000,
  incomingPower: 0,
  outgoingPower: 0,
  delegatorCount: 0,
  delegators: [],
  incomingDelegations: [],
  outgoingDelegations: [],
  percentOfVotingPower: 0,
  blockNumber: '1',
};

const PROPS = {
  address: VIEWED,
  identityAddresses: [VIEWED],
  pin: PIN,
  poolAddress: POOL,
  optOut: null,
  optOutStepAvailable: true,
  nextPower: null,
};

function eventsNamed(name: string) {
  return vi
    .mocked(track)
    .mock.calls.filter(([event]) => event === name)
    .map(([, properties]) => properties);
}

/** Moves the write to `phase`, as the wallet and the chain would. */
function advance(
  rerender: (ui: React.ReactElement) => void,
  phase: SubmissionPhase,
  submission: Submission | null,
  props: Partial<React.ComponentProps<typeof AutoDelegationPath>> = {},
) {
  write.phase = phase;
  write.submission = submission;
  rerender(<AutoDelegationPath {...PROPS} {...props} />);
}

beforeEach(() => {
  session = { phase: 'disconnected', address: undefined };
  connectModalOpen = false;
  gaveUp = false;
  write.submission = null;
  write.phase = 'idle';
  vi.clearAllMocks();
});

describe('AutoDelegationPath connect events', () => {
  it('records the connect click and a modal closed without a wallet', async () => {
    const { rerender } = render(<AutoDelegationPath {...PROPS} />);
    await userEvent.click(screen.getByRole('button', { name: 'Connect wallet to delegate' }));
    rerender(<AutoDelegationPath {...PROPS} />);

    connectModalOpen = false;
    rerender(<AutoDelegationPath {...PROPS} />);

    expect(eventsNamed('delegate_cta_clicked')).toEqual([{ source: 'panel', step: 'connect' }]);
    expect(eventsNamed('connect_modal_closed')).toEqual([{ source: 'panel' }]);
  });

  it('records no closed modal when the wallet connects', async () => {
    const { rerender } = render(<AutoDelegationPath {...PROPS} />);
    await userEvent.click(screen.getByRole('button', { name: 'Connect wallet to delegate' }));
    session = { phase: 'connected', address: VIEWED };
    connectModalOpen = false;
    rerender(<AutoDelegationPath {...PROPS} />);

    expect(eventsNamed('connect_modal_closed')).toEqual([]);
  });
});

describe('AutoDelegationPath offer events', () => {
  it('records nothing for a visitor without a wallet', () => {
    render(<AutoDelegationPath {...PROPS} />);

    expect(eventsNamed('delegate_offer_shown')).toEqual([]);
  });

  it.each([
    ['delegate', VIEWED, PIN],
    ['switch_account', STRANGER, PIN],
    ['none', VIEWED, { ...PIN, votingPower: 0 }],
    ['unavailable', VIEWED, null],
  ] as const)('records the %s offer a connected wallet sees', (offer, connected, pin) => {
    session = { phase: 'connected', address: connected };
    render(<AutoDelegationPath {...PROPS} pin={pin} />);

    expect(eventsNamed('delegate_offer_shown')).toEqual([{ source: 'panel', offer }]);
  });

  it('records the offer once, not again when the delegation is indexed', () => {
    session = { phase: 'connected', address: VIEWED };
    const { rerender } = render(<AutoDelegationPath {...PROPS} />);
    const indexed = {
      ...PIN,
      outgoingPower: 1000,
      outgoingDelegations: [{ address: POOL, power: 1000 }],
    };
    rerender(<AutoDelegationPath {...PROPS} pin={indexed} />);

    expect(eventsNamed('delegate_offer_shown')).toEqual([{ source: 'panel', offer: 'delegate' }]);
  });
});

describe('AutoDelegationPath delegation events', () => {
  beforeEach(() => {
    session = { phase: 'connected', address: VIEWED };
  });

  it('follows a wallet delegation from the leaderboard to its receipt', async () => {
    const { rerender } = render(<AutoDelegationPath {...PROPS} source="leaderboard" />);
    await userEvent.click(screen.getByRole('button', { name: 'Delegate to the DAO' }));
    const sent: Submission = { kind: 'sent', hash: HASH, safe: null };
    advance(rerender, 'pending', sent, { source: 'leaderboard' });
    advance(rerender, 'confirmed', sent, { source: 'leaderboard' });

    expect(eventsNamed('delegation_requested')).toEqual([{ source: 'leaderboard', drops: 'no' }]);
    expect(eventsNamed('delegation_sent')).toEqual([{ source: 'leaderboard', wallet: 'eoa' }]);
    expect(eventsNamed('delegation_confirmed')).toEqual([{ source: 'leaderboard' }]);
  });

  it('records a Safe proposal as sent from the profile', async () => {
    const { rerender } = render(<AutoDelegationPath {...PROPS} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delegate to the DAO' }));
    advance(rerender, 'proposed', { kind: 'sent', hash: HASH, safe: VIEWED });

    expect(eventsNamed('delegation_sent')).toEqual([{ source: 'profile', wallet: 'safe' }]);
  });

  it("records the wallet's refusal", async () => {
    const { rerender } = render(<AutoDelegationPath {...PROPS} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delegate to the DAO' }));
    advance(rerender, 'error', { kind: 'error', message: 'Rejected', reason: 'rejected' });

    expect(eventsNamed('delegation_failed')).toEqual([{ stage: 'wallet', reason: 'rejected' }]);
  });

  it('records a transaction that failed on chain', async () => {
    const { rerender } = render(<AutoDelegationPath {...PROPS} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delegate to the DAO' }));
    const sent: Submission = { kind: 'sent', hash: HASH, safe: null };
    advance(rerender, 'pending', sent);
    advance(rerender, 'failed', sent);

    expect(eventsNamed('delegation_failed')).toEqual([{ stage: 'chain', reason: 'failed' }]);
  });

  it('records nothing for a write remembered from an earlier visit', () => {
    write.submission = { kind: 'sent', hash: HASH, safe: null };
    write.phase = 'confirmed';
    render(<AutoDelegationPath {...PROPS} />);

    expect(eventsNamed('delegation_sent')).toEqual([]);
    expect(eventsNamed('delegation_confirmed')).toEqual([]);
  });

  it('records the delegation API giving up on indexing a write sent here', async () => {
    const { rerender } = render(<AutoDelegationPath {...PROPS} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delegate to the DAO' }));
    const sent: Submission = { kind: 'sent', hash: HASH, safe: null };
    advance(rerender, 'confirmed', sent);
    gaveUp = true;
    advance(rerender, 'confirmed', sent);

    expect(eventsNamed('delegation_index_slow')).toEqual([{}]);
  });

  it('records nothing when indexing a remembered write gives up', () => {
    gaveUp = true;
    write.submission = { kind: 'sent', hash: HASH, safe: null };
    write.phase = 'confirmed';
    render(<AutoDelegationPath {...PROPS} />);

    expect(eventsNamed('delegation_index_slow')).toEqual([]);
  });
});
