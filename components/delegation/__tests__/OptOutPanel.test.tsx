import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OverviewAddress } from '@/lib/delegation/logic/address-overview';

import OptOutPanel from '../OptOutPanel';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined }),
  useSignTypedData: () => ({ signTypedDataAsync: vi.fn() }),
}));

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

function renderPanel(targetAddresses: string[], entry = ENTRY) {
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
});
