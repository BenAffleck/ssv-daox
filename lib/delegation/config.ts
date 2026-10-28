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
export const AUTO_DELEGATION_POOL_ADDRESS = '0x9a62c932F5a8Eb807F655E3D948EdaE174D39D3B';

/** Where a DAO delegate starts contributing: proposals, forum and calls. */
export const SSV_GOVERNANCE_URL = 'https://ssv.network/governance';

/**
 * The DAO's own funding address; it delegates the pool's seed power. The pool
 * summary counts that power as DAO-held, not as a community delegator.
 */
export const DAO_FUNDING_ADDRESS = '0x2Be7549f1B58Fc3E81427a09E61e6D0B050A4C1D';
