const ADDRESS = /0x[a-fA-F0-9]{40}/g;
const ENS_NAME = /[\w-]+(?:\.[\w-]+)*\.eth\b/gi;

/** Replaces wallet addresses and ENS names, so telemetry can't tie a visit to a wallet. */
export function redactAddresses(text: string): string {
  return text.replace(ADDRESS, '[address]').replace(ENS_NAME, '[ens]');
}

/** `beforeSend` for Web Analytics and Speed Insights: page URLs carry `?address=`. */
export function redactEventUrl<T extends { url: string }>(event: T): T {
  return { ...event, url: redactAddresses(event.url) };
}
