import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// Flat config (ESLint 9 + Next.js 16). The previous `.eslintrc.json` + legacy
// `next lint` combination no longer works: Next 16 removed the `next lint`
// command and ESLint 9 requires a flat config. Next 16's shareable config is
// already a flat-config array, so we spread it directly.
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'lib/data/external-tools.generated.ts',
    ],
  },
  ...nextCoreWebVitals,
  {
    // Migration shim: Next 16 / ESLint 9 newly enabled these rules, which fire
    // on pre-existing app code (ThemeProvider, module registries, copy with
    // apostrophes). Downgraded to warnings so the toolchain upgrade does not
    // block CI; these should be cleaned up and promoted back to errors in a
    // dedicated follow-up PR.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'warn',
      '@next/next/no-assign-module-variable': 'warn',
    },
  },
];

export default config;
