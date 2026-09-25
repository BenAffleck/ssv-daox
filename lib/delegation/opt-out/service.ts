import { randomBytes } from 'crypto';
import type { Address, Hex } from 'viem';

import {
  ScoreApiRefusal,
  type OptOutReceipt,
  type OptOutStatuses,
  type ScoreApiOptOutClient,
} from './score-api';
import { buildOptOutTypedData, type OptOutSubmission, type OptOutTypedData } from './typed-data';

/** Matches the Score API's window, so Safe co-signers have time. */
const NONCE_TTL_MS = 24 * 60 * 60 * 1000;

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

export interface OptOutError {
  /** An `OptOutErrorCode`, or a Score API refusal code passed through. */
  code: OptOutErrorCode | (string & {});
  message: string;
  httpStatus: number;
}

export type OptOutResult = { ok: true; receipt: OptOutReceipt } | { ok: false; error: OptOutError };

const ERRORS: Record<OptOutErrorCode, { message: string; httpStatus: number }> = {
  unknown_nonce: { message: 'This request has no valid nonce. Start again.', httpStatus: 400 },
  nonce_mismatch: {
    message: 'This request does not match the one DAOx issued. Start again.',
    httpStatus: 400,
  },
  nonce_address_mismatch: {
    message: 'This request was issued for another address. Start again.',
    httpStatus: 400,
  },
  nonce_expired: { message: 'This request expired after a day. Start again.', httpStatus: 400 },
  nonce_used: { message: 'This signature was already submitted. Start again.', httpStatus: 409 },
  invalid_signature: {
    message: 'The signature is not from the address it opts out.',
    httpStatus: 401,
  },
  score_api_unavailable: {
    message: 'The Score API did not accept the request. Try again later.',
    httpStatus: 502,
  },
};

function failure(code: OptOutErrorCode): OptOutResult {
  return { ok: false, error: { code, ...ERRORS[code] } };
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
        if (error instanceof ScoreApiRefusal) {
          const { code, message, httpStatus } = error;
          return { ok: false, error: { code, message, httpStatus } };
        }
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
