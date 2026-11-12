import { track } from '@vercel/analytics';

import type { OptOutAction } from '@/lib/delegation/opt-out/typed-data';

import { redactAddresses } from './redact';

/**
 * Every custom analytics event and its properties. Properties MUST NOT carry
 * wallet addresses or ENS names; `trackEvent` redacts any that slip through.
 */
export interface TelemetryEvents {
  wallet_connected: { connector: string };
  delegation_lookup: { result: 'listed' | 'not_listed' | 'unresolved' };
  optout_started: { action: OptOutAction };
  optout_signed: { action: OptOutAction };
  optout_submitted: { action: OptOutAction; via: 'wallet' | 'safe' };
  optout_failed: {
    action: OptOutAction;
    stage: 'nonce' | 'sign' | 'submit' | 'safe_check';
    reason: string;
  };
  ai_summary_requested: Record<string, never>;
  ai_qna_asked: Record<string, never>;
  ai_rate_limited: { feature: 'summary' | 'qna' };
  timeline_extract_clicked: Record<string, never>;
  client_error: { boundary: 'root' | 'module'; digest: string };
}

export type TelemetryEvent = keyof TelemetryEvents;

export function trackEvent<E extends TelemetryEvent>(name: E, properties: TelemetryEvents[E]) {
  const redacted = Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      key,
      typeof value === 'string' ? redactAddresses(value) : value,
    ]),
  );
  try {
    track(name, redacted);
  } catch {
    // Analytics is best effort; the user's flow carries on.
  }
}
