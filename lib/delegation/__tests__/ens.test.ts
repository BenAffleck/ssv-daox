import { describe, expect, it } from 'vitest';

import { normalizedEnsName } from '../logic/ens';

describe('normalizedEnsName', () => {
  it('normalizes an ENS name', () => {
    expect(normalizedEnsName('Vitalik.ETH')).toBe('vitalik.eth');
  });

  it('accepts subdomains and non-.eth TLDs', () => {
    expect(normalizedEnsName('mainnet.ssvnetwork.eth')).toBe('mainnet.ssvnetwork.eth');
    expect(normalizedEnsName('nick.xyz')).toBe('nick.xyz');
  });

  it('rejects addresses and plain words', () => {
    expect(normalizedEnsName('0xAAA1111111111111111111111111111111111111')).toBeNull();
    expect(normalizedEnsName('vitalik')).toBeNull();
    expect(normalizedEnsName('')).toBeNull();
  });

  it('rejects names ENS cannot normalize', () => {
    expect(normalizedEnsName('foo..eth')).toBeNull();
    expect(normalizedEnsName('foo bar.eth')).toBeNull();
  });
});
