export interface HighSignalConfig {
  /** SSV project page; sign-in with Discord happens here. */
  projectUrl: string;
  /** Personal settings page, where linked wallets are managed. `{username}` is replaced. */
  settingsUrlTemplate: string;
  /** Public profile page. `{username}` is replaced. */
  profileUrlTemplate: string;
}

/**
 * HighSignal routes found in its client bundle. They may change, so all are
 * configurable and every wizard step is also described in text.
 */
export function getHighSignalConfig(): HighSignalConfig {
  return {
    projectUrl: process.env.HIGHSIGNAL_PROJECT_URL?.trim() || 'https://app.highsignal.xyz/p/ssv/',
    settingsUrlTemplate:
      process.env.HIGHSIGNAL_SETTINGS_URL_TEMPLATE?.trim() ||
      'https://app.highsignal.xyz/settings/u/{username}',
    profileUrlTemplate:
      process.env.HIGHSIGNAL_PROFILE_URL_TEMPLATE?.trim() ||
      'https://app.highsignal.xyz/u/{username}',
  };
}

/**
 * The DAO's auto-delegation pool. Score runs redistribute its power across
 * cohort seats. A governance fact, so not an environment variable.
 */
export const AUTO_DELEGATION_POOL_ADDRESS = '0xb35096b074fdb9bBac63E3AdaE0Bbde512B2E6b6';

/**
 * Most voting power score runs allocate from the pool. A governance rule;
 * the scoring endpoint's allocations stop at this cap.
 */
export const AUTO_DELEGATION_PROGRAM_CAP = 500_000;
