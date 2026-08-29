/**
 * Transforms a raw Gnosis delegation API response into VotingPowerData
 */

import type {
  DelegationEntry,
  GnosisDelegateTreeNode,
  GnosisDelegationResponse,
  GnosisDelegatorTreeNode,
  VotingPowerData,
} from '../types';

/**
 * The pin endpoint returns numeric fields inconsistently (numbers or strings),
 * so coerce defensively.
 */
function toNumber(value: string | number | undefined): number {
  return parseFloat(String(value)) || 0;
}

/**
 * Builds a counterparty list sorted by delegated power descending
 */
function toDelegationEntries(
  nodes: Array<GnosisDelegatorTreeNode | GnosisDelegateTreeNode> | undefined,
  addressOf: (node: GnosisDelegatorTreeNode | GnosisDelegateTreeNode) => string | undefined,
): DelegationEntry[] {
  if (!nodes) {
    return [];
  }

  return nodes
    .map((node) => ({
      address: addressOf(node) ?? '',
      power: toNumber(node.delegatedPower),
    }))
    .filter((entry) => entry.address !== '')
    .sort((a, b) => b.power - a.power);
}

/**
 * Converts a pin endpoint response into the shape consumed by the UI
 */
export function toVotingPowerData(data: GnosisDelegationResponse): VotingPowerData {
  let incomingDelegations = toDelegationEntries(
    data.delegatorTree,
    (node) => (node as GnosisDelegatorTreeNode).delegator,
  );

  // Older/partial responses can list delegators without the weighted tree;
  // keep the addresses visible with an unknown amount rather than dropping them.
  if (incomingDelegations.length === 0 && data.delegators?.length) {
    incomingDelegations = data.delegators.map((address) => ({
      address,
      power: null,
    }));
  }

  const outgoingDelegations = toDelegationEntries(
    data.delegateTree,
    (node) => (node as GnosisDelegateTreeNode).delegate,
  );

  return {
    votingPower: toNumber(data.votingPower),
    incomingPower: toNumber(data.incomingPower),
    outgoingPower: toNumber(data.outgoingPower),
    delegatorCount: data.delegators?.length || 0,
    delegators: data.delegators || [],
    incomingDelegations,
    outgoingDelegations,
    percentOfVotingPower: toNumber(data.percentOfVotingPower),
    blockNumber: data.blockNumber,
  };
}
