export const OPT_OUT_CONFIG = {
  /**
   * The Score API has no opt-out endpoint yet, so the mock is on unless
   * `OPT_OUT_MOCK=false`. With the mock on, the UI shows a "Demo" banner.
   */
  get mockEnabled(): boolean {
    return process.env.OPT_OUT_MOCK?.trim().toLowerCase() !== 'false';
  },
  /** Mainnet Safe Transaction Service, for resuming Safe requests. */
  get safeTxServiceUrl(): string {
    return (
      process.env.SAFE_TX_SERVICE_URL?.trim().replace(/\/+$/, '') ||
      'https://api.safe.global/tx-service/eth'
    );
  },
  nonceFilePath: '.cache/opt-out-nonces.json',
  mockFilePath: '.cache/opt-out-mock.json',
} as const;
