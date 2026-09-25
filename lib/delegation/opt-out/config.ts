export const OPT_OUT_CONFIG = {
  /**
   * The Score API has no opt-out endpoint yet, so the mock is on unless
   * `OPT_OUT_MOCK=false`. With the mock on, the UI shows a "Demo" banner.
   */
  get mockEnabled(): boolean {
    return process.env.OPT_OUT_MOCK?.trim().toLowerCase() !== 'false';
  },
  nonceFilePath: '.cache/opt-out-nonces.json',
  mockFilePath: '.cache/opt-out-mock.json',
} as const;
