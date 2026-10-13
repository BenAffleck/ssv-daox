import type { NextConfig } from 'next';

const LEGACY_DELEGATE_HOST = [{ type: 'host' as const, value: 'delegate.ssv.network' }];

const nextConfig: NextConfig = {
  // `@coinbase/cdp-sdk` dynamically imports optional `@x402/*` packages, which breaks SSR bundling.
  // RainbowKit's Base Account connector pulls it in; that code path never runs here.
  serverExternalPackages: ['@coinbase/cdp-sdk'],
  // The retired delegate.ssv.network site. First match wins, so the profile rule must stay first.
  async redirects() {
    return [
      {
        source: '/profile/:address/:rest*',
        has: LEGACY_DELEGATE_HOST,
        destination: 'https://daox.ssv.network/delegation?address=:address',
        permanent: true,
      },
      {
        source: '/:path*',
        has: LEGACY_DELEGATE_HOST,
        destination: 'https://daox.ssv.network/delegates',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
