import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The delegates page reads the frozen CSV snapshot at runtime.
  outputFileTracingIncludes: {
    '/delegates': ['./data/delegates/karma-delegates.csv'],
  },
};

export default nextConfig;
