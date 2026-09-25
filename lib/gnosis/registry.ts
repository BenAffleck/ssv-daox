/**
 * Gnosis Guild Split Delegation registry (DelegateRegistry.sol, gnosisguild/split-delegation).
 * Selectors checked against the deployed bytecode on mainnet.
 */

import { pad, type Address, type Hex } from 'viem';

export const SPLIT_DELEGATION_REGISTRY: Address = '0xDE1e8A7E184Babd9F0E3af18f40634e9Ed6F0905';

export const SPLIT_DELEGATION_ABI = [
  {
    type: 'function',
    name: 'setDelegation',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'context', type: 'string' },
      {
        name: 'delegation',
        type: 'tuple[]',
        components: [
          { name: 'delegate', type: 'bytes32' },
          { name: 'ratio', type: 'uint256' },
        ],
      },
      { name: 'expirationTimestamp', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'clearDelegation',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'context', type: 'string' }],
    outputs: [],
  },
] as const;

/** An expiration of 0 never expires. */
export const NO_EXPIRATION = BigInt(0);

export interface RegistryDelegation {
  delegate: Hex;
  ratio: bigint;
}

/**
 * Encodes delegations for `setDelegation`. The delegate is the address
 * left-padded to bytes32. The contract reverts unless delegates are strictly
 * ascending. Ratios are relative weights; the indexer normalises them by their sum.
 */
export function toRegistryDelegations(
  delegations: { address: string; bps: number }[],
): RegistryDelegation[] {
  return delegations
    .map((d) => ({ delegate: pad(d.address.toLowerCase() as Hex), ratio: BigInt(d.bps) }))
    .sort((a, b) => (a.delegate < b.delegate ? -1 : a.delegate > b.delegate ? 1 : 0));
}
