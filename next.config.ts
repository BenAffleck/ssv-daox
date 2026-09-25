import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `@coinbase/cdp-sdk` dynamically imports optional `@x402/*` packages, which breaks SSR bundling.
  // RainbowKit's Base Account connector pulls it in; that code path never runs here.
  serverExternalPackages: ['@coinbase/cdp-sdk'],
};

export default nextConfig;
