import type { NextConfig } from 'next';

const LEGACY_DELEGATE_HOST = [{ type: 'host' as const, value: 'delegate.ssv.network' }];

const nextConfig: NextConfig = {
  // The delegates page reads the frozen CSV snapshot at runtime.
  outputFileTracingIncludes: {
    '/delegates': ['./data/delegates/karma-delegates.csv'],
  },
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
