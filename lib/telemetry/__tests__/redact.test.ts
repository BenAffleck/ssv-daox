import { describe, expect, it } from 'vitest';

import { redactAddresses, redactEventUrl } from '../redact';

const ADDRESS = '0x1111111111111111111111111111111111111111';

describe('redactAddresses', () => {
  it('hides a wallet address and an ENS name in free text', () => {
    expect(redactAddresses(`fetch failed for ${ADDRESS} (vitalik.eth)`)).toBe(
      'fetch failed for [address] ([ens])',
    );
  });
});

describe('redactEventUrl', () => {
  const page = (url: string) => redactEventUrl({ type: 'pageview', url }).url;

  it('hides a wallet address in the query string', () => {
    expect(page(`https://daox.ssv.network/delegation?address=${ADDRESS}`)).toBe(
      'https://daox.ssv.network/delegation?address=[redacted]',
    );
  });

  it('hides an encoded unicode ENS name, which no address pattern matches', () => {
    expect(page('https://daox.ssv.network/delegation?address=%F0%9F%A6%8A%2Eeth&tab=x')).toBe(
      'https://daox.ssv.network/delegation?address=[redacted]&tab=x',
    );
  });

  it('keeps UTM parameters so campaign links stay attributable', () => {
    const url = 'https://daox.ssv.network/?utm_source=x&utm_campaign=distributed-vote';

    expect(page(url)).toBe(url);
  });
});
