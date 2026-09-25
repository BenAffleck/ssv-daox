import type { Address, Hex } from 'viem';

export const OPT_OUT_ACTIONS = ['opt-out', 'opt-in'] as const;

export type OptOutAction = (typeof OPT_OUT_ACTIONS)[number];

export interface OptOutMessage {
  address: Address;
  action: OptOutAction;
  nonce: string;
  /** ISO 8601 timestamp of the nonce, so the wallet shows a readable date. */
  issuedAt: string;
}

export const OPT_OUT_DOMAIN = { name: 'SSV DAOx', version: '1', chainId: 1 } as const;

export const OPT_OUT_TYPES = {
  OptOut: [
    { name: 'address', type: 'address' },
    { name: 'action', type: 'string' },
    { name: 'nonce', type: 'string' },
    { name: 'issuedAt', type: 'string' },
  ],
} as const;

export function buildOptOutTypedData(message: OptOutMessage) {
  return {
    domain: OPT_OUT_DOMAIN,
    types: OPT_OUT_TYPES,
    primaryType: 'OptOut' as const,
    message,
  };
}

export type OptOutTypedData = ReturnType<typeof buildOptOutTypedData>;

export interface OptOutSubmission {
  typedData: OptOutTypedData;
  signature: Hex;
}
