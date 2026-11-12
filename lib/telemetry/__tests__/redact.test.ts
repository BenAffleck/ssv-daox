import { describe, expect, it } from 'vitest';

import { redactAddresses } from '../redact';

describe('redactAddresses', () => {
  it('hides a wallet address in the query string', () => {
    expect(
      redactAddresses(
        'https://daox.ssv.network/delegation?address=0x1111111111111111111111111111111111111111',
      ),
    ).toBe('https://daox.ssv.network/delegation?address=[address]');
  });

  it('hides an ENS name in the query string', () => {
    expect(redactAddresses('https://daox.ssv.network/delegation?address=vitalik.eth')).toBe(
      'https://daox.ssv.network/delegation?address=[ens]',
    );
  });

  it('keeps UTM parameters so campaign links stay attributable', () => {
    const url = 'https://daox.ssv.network/?utm_source=x&utm_campaign=distributed-vote';

    expect(redactAddresses(url)).toBe(url);
  });
});
