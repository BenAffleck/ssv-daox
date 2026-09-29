import { describe, expect, it } from 'vitest';

import { delegationUrlOnWalletChange } from '../logic/wallet-navigation';

const OWN = '0xAAA1111111111111111111111111111111111111';
const OTHER = '0xBBB2222222222222222222222222222222222222';

const connected = (address: string) => ({ phase: 'connected' as const, address });
const disconnected = { phase: 'disconnected' as const };

describe('delegationUrlOnWalletChange', () => {
  it('stays when a session is restored on page load', () => {
    expect(delegationUrlOnWalletChange(null, connected(OWN), '')).toBeNull();
  });

  it('opens the wallet address after connecting on the lookup page', () => {
    expect(delegationUrlOnWalletChange(disconnected, connected(OWN), '')).toBe(
      `/delegation?address=${OWN}`,
    );
  });

  it('stays on a viewed address after connecting', () => {
    expect(delegationUrlOnWalletChange(disconnected, connected(OWN), OTHER)).toBeNull();
  });

  it('follows an account switch', () => {
    expect(delegationUrlOnWalletChange(connected(OWN), connected(OTHER), OWN)).toBe(
      `/delegation?address=${OTHER}`,
    );
  });

  it('stays when the switched-to account is already viewed, in any case', () => {
    expect(
      delegationUrlOnWalletChange(connected(OWN), connected(OTHER), OTHER.toLowerCase()),
    ).toBeNull();
  });

  it('returns to the lookup page after disconnecting from the viewed address', () => {
    expect(delegationUrlOnWalletChange(connected(OWN), disconnected, OWN.toLowerCase())).toBe(
      '/delegation',
    );
  });

  it('stays on another address after disconnecting', () => {
    expect(delegationUrlOnWalletChange(connected(OWN), disconnected, OTHER)).toBeNull();
  });
});
