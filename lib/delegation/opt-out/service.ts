import { randomBytes } from 'crypto';
import type { Address, Hex } from 'viem';

import type { OptOutReceipt, OptOutStatuses, ScoreApiOptOutClient } from './score-api';
import { buildOptOutTypedData, type OptOutSubmission, type OptOutTypedData } from './typed-data';

const NONCE_TTL_MS = 10 * 60 * 1000;

export interface NonceRecord {
  nonce: string;
  /** Lowercase address the nonce was issued to. */
  address: string;
  issuedAt: string;
  expiresAt: string;
  used: boolean;
}

export interface NonceStore {
  save(record: NonceRecord): Promise<void>;
  find(nonce: string): Promise<NonceRecord | null>;
  /** Returns `false` when the nonce is unknown or already used. */
  markUsed(nonce: string): Promise<boolean>;
}

/** Checks `signature` against `address`; contract wallets go through EIP-1271. */
export type SignatureVerifier = (args: {
  address: Address;
  typedData: OptOutTypedData;
  signature: Hex;
}) => Promise<boolean>;

export interface OptOutServiceDeps {
  nonces: NonceStore;
  scoreApi: ScoreApiOptOutClient;
  verifySignature: SignatureVerifier;
  now?: () => Date;
}

export interface IssuedNonce {
  nonce: string;
  issuedAt: string;
}

export type OptOutErrorCode =
  | 'unknown_nonce'
  | 'nonce_mismatch'
  | 'nonce_expired'
  | 'nonce_used'
  | 'nonce_address_mismatch'
  | 'invalid_signature'
  | 'score_api_unavailable';

export type OptOutResult =
  | { ok: true; receipt: OptOutReceipt }
  | { ok: false; error: { code: OptOutErrorCode; message: string } };

const ERROR_MESSAGES: Record<OptOutErrorCode, string> = {
  unknown_nonce: 'This request has no valid nonce. Start again.',
  nonce_mismatch: 'This request does not match the one DAOx issued. Start again.',
  nonce_address_mismatch: 'This request was issued for another address. Start again.',
  nonce_expired: 'This request expired after 10 minutes. Start again.',
  nonce_used: 'This signature was already submitted. Start again.',
  invalid_signature: 'The signature is not from the address it opts out.',
  score_api_unavailable: 'The Score API did not accept the request. Try again later.',
};

function failure(code: OptOutErrorCode): OptOutResult {
  return { ok: false, error: { code, message: ERROR_MESSAGES[code] } };
}

export function createOptOutService({
  nonces,
  scoreApi,
  verifySignature,
  now = () => new Date(),
}: OptOutServiceDeps) {
  return {
    mode: scoreApi.mode,

    async issueNonce(address: string): Promise<IssuedNonce> {
      const issued = now();
      const record: NonceRecord = {
        nonce: randomBytes(16).toString('hex'),
        address: address.toLowerCase(),
        issuedAt: issued.toISOString(),
        expiresAt: new Date(issued.getTime() + NONCE_TTL_MS).toISOString(),
        used: false,
      };
      await nonces.save(record);
      return { nonce: record.nonce, issuedAt: record.issuedAt };
    },

    async submitOptOut({ typedData, signature }: OptOutSubmission): Promise<OptOutResult> {
      // Only the message is trusted from the client; domain and types are ours.
      const canonical = buildOptOutTypedData(typedData.message);
      const { address, nonce, issuedAt } = canonical.message;

      const record = await nonces.find(nonce);
      if (!record) {
        return failure('unknown_nonce');
      }
      if (record.address !== address.toLowerCase()) {
        return failure('nonce_address_mismatch');
      }
      if (record.issuedAt !== issuedAt) {
        return failure('nonce_mismatch');
      }
      if (now().getTime() > Date.parse(record.expiresAt)) {
        return failure('nonce_expired');
      }
      if (record.used) {
        return failure('nonce_used');
      }
      if (!(await verifySignature({ address, typedData: canonical, signature }))) {
        return failure('invalid_signature');
      }
      // A concurrent submission of the same nonce may have won the race.
      if (!(await nonces.markUsed(nonce))) {
        return failure('nonce_used');
      }
      try {
        const receipt = await scoreApi.submit({ typedData: canonical, signature });
        return { ok: true, receipt };
      } catch (error) {
        console.error('Opt-out submission failed:', error);
        return failure('score_api_unavailable');
      }
    },

    getStatuses(addresses: string[]): Promise<OptOutStatuses> {
      return scoreApi.getStatuses(addresses);
    },
  };
}

export type OptOutService = ReturnType<typeof createOptOutService>;
