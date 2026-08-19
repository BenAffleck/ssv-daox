import { describe, it, expect } from 'vitest';
import { toVotingPowerData } from '../logic/transform-voting-power';
import type { GnosisDelegationResponse } from '../types';

function response(
  overrides: Partial<GnosisDelegationResponse> = {}
): GnosisDelegationResponse {
  return {
    votingPower: '1000',
    incomingPower: '300',
    outgoingPower: '0',
    delegators: [],
    percentOfVotingPower: '0.1',
    blockNumber: '20000000',
    ...overrides,
  };
}

describe('toVotingPowerData', () => {
  it('pairs each delegator with the absolute power it delegates in', () => {
    const result = toVotingPowerData(
      response({
        delegators: ['0xaaa', '0xbbb'],
        delegatorTree: [
          { delegator: '0xaaa', delegatedPower: 100 },
          { delegator: '0xbbb', delegatedPower: 200 },
        ],
      })
    );

    expect(result.incomingDelegations).toEqual([
      { address: '0xbbb', power: 200 },
      { address: '0xaaa', power: 100 },
    ]);
    expect(result.delegatorCount).toBe(2);
  });

  it('pairs each delegate with the absolute power delegated out to it', () => {
    const result = toVotingPowerData(
      response({
        outgoingPower: '75',
        delegates: ['0xccc'],
        delegateTree: [{ delegate: '0xccc', delegatedPower: '75' }],
      })
    );

    expect(result.outgoingDelegations).toEqual([{ address: '0xccc', power: 75 }]);
  });

  it('sorts delegation entries by power descending', () => {
    const result = toVotingPowerData(
      response({
        delegatorTree: [
          { delegator: '0xaaa', delegatedPower: 1 },
          { delegator: '0xccc', delegatedPower: 300 },
          { delegator: '0xbbb', delegatedPower: 20 },
        ],
      })
    );

    expect(result.incomingDelegations.map((e) => e.address)).toEqual([
      '0xccc',
      '0xbbb',
      '0xaaa',
    ]);
  });

  it('falls back to the flat delegators list with an unknown amount when no tree is returned', () => {
    const result = toVotingPowerData(response({ delegators: ['0xaaa'] }));

    expect(result.incomingDelegations).toEqual([{ address: '0xaaa', power: null }]);
  });

  it('returns empty delegation lists when the response carries none', () => {
    const result = toVotingPowerData(response());

    expect(result.incomingDelegations).toEqual([]);
    expect(result.outgoingDelegations).toEqual([]);
  });

  it('coerces numeric fields returned as numbers or strings', () => {
    const result = toVotingPowerData(
      response({ votingPower: 1234.5 as unknown as string })
    );

    expect(result.votingPower).toBe(1234.5);
  });
});
