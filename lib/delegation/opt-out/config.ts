import os from 'os';
import path from 'path';

/** Vercel functions can write only to `/tmp`; the deployment directory is read-only. */
function cacheRoot(): string {
  return process.env.VERCEL ? os.tmpdir() : process.cwd();
}

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
  get nonceFilePath(): string {
    return path.join(cacheRoot(), '.cache/opt-out-nonces.json');
  },
  get mockFilePath(): string {
    return path.join(cacheRoot(), '.cache/opt-out-mock.json');
  },
} as const;
