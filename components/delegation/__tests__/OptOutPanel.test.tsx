import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { track } from '@vercel/analytics';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { OverviewAddress } from '@/lib/delegation/logic/address-overview';

import OptOutPanel from '../OptOutPanel';

const wallet = vi.hoisted(() => ({
  address: undefined as string | undefined,
  sign: (() => Promise.resolve('0xsig')) as () => Promise<string>,
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: wallet.address }),
  useSignTypedData: () => ({ signTypedDataAsync: () => wallet.sign() }),
}));
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));

const ADDRESS = '0x1111111111111111111111111111111111111111';

const ENTRY: OverviewAddress = {
  address: ADDRESS,
  ensName: null,
  isRequested: true,
  rank: 3,
  score: 80,
  cohort: null,
  allocatedPower: null,
  claimStatus: 'claimed_scored',
  highSignal: { projectUrl: 'https://example.com', settingsUrl: null, profileUrl: null },
  optOut: null,
  safeRequest: null,
};

function renderPanel(targetAddresses: string[] | null, entry = ENTRY) {
  return render(
    <OptOutPanel
      addresses={[entry]}
      targetAddresses={targetAddresses}
      mode="live"
      signingAvailable
    />,
  );
}

describe('OptOutPanel', () => {
  it('is disabled with a hint when the DAO does not delegate to the address', () => {
    renderPanel([]);

    expect(screen.getByText(/isn't a DAO delegation target/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show/ })).toBeDisabled();
  });

  it('is usable when the DAO delegates to the address, in any letter case', () => {
    renderPanel([ADDRESS.toUpperCase().replace('0X', '0x')]);

    expect(screen.queryByText(/isn't a DAO delegation target/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show/ })).toBeEnabled();
  });

  it('says it could not check, rather than "not a target", when the lookup failed', () => {
    renderPanel(null);

    expect(screen.getByText(/Couldn't check whether the DAO delegates/)).toBeInTheDocument();
    expect(screen.queryByText(/isn't a DAO delegation target/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show/ })).toBeDisabled();
  });
});

describe('OptOutPanel telemetry', () => {
  afterEach(() => {
    wallet.address = undefined;
    wallet.sign = () => Promise.resolve('0xsig');
    vi.mocked(track).mockClear();
    vi.unstubAllGlobals();
  });

  function stubServer(optOutStatus = 200) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/opt-out/nonce') {
          return Response.json({ nonce: 'n1', issuedAt: '2026-11-12T10:00:00Z' });
        }
        if (url === '/api/opt-out') {
          return Response.json(
            optOutStatus === 200 ? {} : { error: { code: 'superseded', message: 'x' } },
            { status: optOutStatus },
          );
        }
        return new Response(null, { status: 503 });
      }),
    );
  }

  async function signAsOwner() {
    wallet.address = ADDRESS;
    renderPanel([ADDRESS]);
    await userEvent.click(screen.getByRole('button', { name: /Show/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Sign opt-out' }));
  }

  function trackedNames() {
    return vi.mocked(track).mock.calls.map(([name]) => name);
  }

  it('records each step of a successful opt-out', async () => {
    stubServer();

    await signAsOwner();

    await waitFor(() =>
      expect(trackedNames()).toEqual(['optout_started', 'optout_signed', 'optout_submitted']),
    );
    expect(track).toHaveBeenCalledWith('optout_submitted', { action: 'opt-out', via: 'wallet' });
  });

  it('records a wallet rejection as a failed signature', async () => {
    stubServer();
    wallet.sign = () =>
      Promise.reject(Object.assign(new Error('no'), { name: 'UserRejectedRequestError' }));

    await signAsOwner();

    await waitFor(() =>
      expect(track).toHaveBeenCalledWith('optout_failed', {
        action: 'opt-out',
        stage: 'sign',
        reason: 'rejected',
      }),
    );
  });

  it('records a refused submission with the server code', async () => {
    stubServer(409);

    await signAsOwner();

    await waitFor(() =>
      expect(track).toHaveBeenCalledWith('optout_failed', {
        action: 'opt-out',
        stage: 'submit',
        reason: 'superseded',
      }),
    );
  });
});
