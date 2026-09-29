import { isAddress } from './address-overview';
import { sameAddress } from './pool';

/** A wallet state the UI has settled on; connecting and restoring are not settled. */
export type SettledWallet = { phase: 'disconnected' } | { phase: 'connected'; address: string };

/**
 * Where the Delegation page goes when the wallet settles into a new state;
 * `null` to stay. `previous` is `null` until the page load's session restore
 * settles, so restoring never navigates.
 */
export function delegationUrlOnWalletChange(
  previous: SettledWallet | null,
  current: SettledWallet,
  selected: string,
): string | null {
  if (previous === null) {
    return null;
  }
  if (current.phase === 'connected') {
    const opens =
      previous.phase === 'connected'
        ? !sameAddress(previous.address, current.address)
        : !isAddress(selected);
    return opens && !sameAddress(current.address, selected)
      ? `/delegation?address=${current.address}`
      : null;
  }
  return previous.phase === 'connected' && sameAddress(previous.address, selected)
    ? '/delegation'
    : null;
}
