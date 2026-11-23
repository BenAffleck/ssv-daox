import { describe, expect, it } from 'vitest';
import { mainnet } from 'wagmi/chains';

import { createWagmiConfig } from '../wagmi-config';

describe('createWagmiConfig', () => {
  // The WalletConnect connector reuses this URL as its RPC endpoint and rejects relative URLs.
  it('gives the mainnet transport an absolute URL to the RPC proxy', () => {
    const config = createWagmiConfig('test-project-id');

    const { transport } = config.getClient({ chainId: mainnet.id });

    expect(transport.url).toBe(`${window.location.origin}/api/rpc`);
  });
});
