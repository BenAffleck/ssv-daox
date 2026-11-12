import { track } from '@vercel/analytics';

import type { OptOutAction } from '@/lib/delegation/opt-out/typed-data';

import { redactAddresses } from './redact';

/** Where a campaign action sits: the leaderboard's pool banner or the profile's "Delegate to the DAO" panel. */
export type CampaignPlacement = 'banner' | 'panel';
/** The route that led to the profile: the leaderboard banner or anything else. */
export type DelegationSource = 'leaderboard' | 'profile';
/** What the wallet is offered: power to delegate, power received from or delegated to the DAO, nothing, a failed load, or another address. */
export type DelegateOffer =
  'delegate' | 'received' | 'delegated' | 'none' | 'unavailable' | 'switch_account';
/** Why a delegation write failed: in the wallet before a hash, or on chain (reverted, or its receipt couldn't be fetched). */
export type DelegationFailure =
  | { stage: 'wallet'; reason: 'rejected' | 'chain_mismatch' | 'error' }
  | { stage: 'chain'; reason: 'failed' };

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
  delegate_cta_clicked: { source: CampaignPlacement; step: 'connect' | 'open' };
  connect_modal_closed: { source: CampaignPlacement };
  delegate_offer_shown: { source: CampaignPlacement; offer: DelegateOffer };
  delegation_requested: { source: DelegationSource; drops: 'yes' | 'no' };
  delegation_sent: { source: DelegationSource; wallet: 'eoa' | 'safe' };
  delegation_confirmed: { source: DelegationSource };
  delegation_failed: DelegationFailure;
  delegation_index_slow: Record<string, never>;
  campaign_link_clicked: { placement: CampaignPlacement };
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
