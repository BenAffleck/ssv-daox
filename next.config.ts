import type { NextConfig } from 'next';

const LEGACY_DELEGATE_HOST = [{ type: 'host' as const, value: 'delegate.ssv.network' }];

const nextConfig: NextConfig = {
  // `@coinbase/cdp-sdk` dynamically imports optional `@x402/*` packages, which breaks SSR bundling.
  // RainbowKit's Base Account connector pulls it in; that code path never runs here.
  serverExternalPackages: ['@coinbase/cdp-sdk'],
  // First match wins, so the legacy profile rule must stay before the legacy catch-all.
  async redirects() {
    return [
      // The retired delegate.ssv.network site.
      {
        source: '/profile/:address/:rest*',
        has: LEGACY_DELEGATE_HOST,
        destination: 'https://daox.ssv.network/delegation?address=:address',
        permanent: true,
      },
      {
        source: '/:path*',
        has: LEGACY_DELEGATE_HOST,
        destination: 'https://daox.ssv.network/leaderboard',
        permanent: true,
      },
      // The leaderboard's old path. Next keeps the query string, so filter links survive.
      { source: '/delegates', destination: '/leaderboard', permanent: true },
    ];
  },
};

export default nextConfig;
