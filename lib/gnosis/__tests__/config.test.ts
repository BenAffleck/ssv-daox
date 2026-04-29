import { describe, it, expect } from 'vitest';
import { GNOSIS_CONFIG, SSV_STRATEGY_PAYLOAD } from '../config';

describe('SSV_STRATEGY_PAYLOAD', () => {
  const strategies = SSV_STRATEGY_PAYLOAD.strategy.params.strategies;

  it('uses split-delegation on mainnet', () => {
    expect(SSV_STRATEGY_PAYLOAD.strategy.name).toBe('split-delegation');
    expect(SSV_STRATEGY_PAYLOAD.strategy.network).toBe('1');
    expect(SSV_STRATEGY_PAYLOAD.strategy.params.delegationOverride).toBe(false);
    expect(SSV_STRATEGY_PAYLOAD.strategy.params.totalSupply).toBe(0);
  });

  it('contains exactly three sub-strategies', () => {
    expect(strategies).toHaveLength(3);
  });

  it('preserves the SSV vesting balance contract-call as the first sub-strategy', () => {
    const vesting = strategies[0] as any;
    expect(vesting.name).toBe('contract-call');
    expect(vesting.params.symbol).toBe('SSV');
    expect(vesting.params.address).toBe(
      '0xB8471180C79A0a69C7790A1CCf62e91b3c3559Bf'
    );
    expect(vesting.params.decimals).toBe(18);
    expect(vesting.params.methodABI.name).toBe('totalVestingBalanceOf');
  });

  it('preserves the SSV ERC20 balance-of as the second sub-strategy', () => {
    const ssvErc20 = strategies[1] as any;
    expect(ssvErc20.name).toBe('erc20-balance-of');
    expect(ssvErc20.params.symbol).toBe('SSV');
    expect(ssvErc20.params.address).toBe(
      '0x9D65fF81a3c488d585bBfb0Bfe3c7707c7917f54'
    );
    expect(ssvErc20.params.decimals).toBe(18);
  });

  it('adds the cSSV ERC20 balance-of as the third sub-strategy', () => {
    const cssv = strategies[2] as any;
    expect(cssv.name).toBe('erc20-balance-of');
    expect(cssv.params.symbol).toBe('cSSV');
    expect(cssv.params.address).toBe(
      '0xe018D31F120A637828F46aFD6c64EC099d960546'
    );
    expect(cssv.params.decimals).toBe(18);
    expect(cssv.network).toBe('1');
  });

  it('exposes the strategy payload through GNOSIS_CONFIG', () => {
    expect(GNOSIS_CONFIG.strategyPayload).toBe(SSV_STRATEGY_PAYLOAD);
  });
});
