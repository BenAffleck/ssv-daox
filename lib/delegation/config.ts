export interface HighSignalConfig {
  /** SSV project page; sign-in with Discord happens here. */
  projectUrl: string;
  /** Personal settings page, where linked wallets are managed. `{username}` is replaced. */
  settingsUrlTemplate: string;
}

/**
 * HighSignal routes found in its client bundle. They may change, so both are
 * configurable and every wizard step is also described in text.
 */
export function getHighSignalConfig(): HighSignalConfig {
  return {
    projectUrl: process.env.HIGHSIGNAL_PROJECT_URL?.trim() || 'https://app.highsignal.xyz/p/ssv/',
    settingsUrlTemplate:
      process.env.HIGHSIGNAL_SETTINGS_URL_TEMPLATE?.trim() ||
      'https://app.highsignal.xyz/settings/u/{username}',
  };
}
