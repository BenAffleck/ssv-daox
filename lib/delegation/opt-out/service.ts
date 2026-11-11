import { getAddress, hashTypedData, type Address, type Hex } from 'viem';

import type { IssuedNonce, NonceRecord, NonceStore, RedemptionFailure } from './nonce-store';
import { safeMessageHashOf, type SafeTransactionService } from './safe-tx-service';
import {
  ScoreApiRefusal,
  type OptOutReceipt,
  type OptOutStatuses,
  type ScoreApiOptOutClient,
} from './score-api';
import {
  buildOptOutTypedData,
  type OptOutAction,
  type OptOutSubmission,
  type OptOutTypedData,
} from './typed-data';

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
  safeTxService: SafeTransactionService;
}

export type OptOutErrorCode =
  | RedemptionFailure
  | 'score_api_unavailable'
  | 'not_a_safe'
  | 'safe_lookup_unavailable'
  | 'onchain_signature_unsupported';

export interface OptOutError {
  /** An `OptOutErrorCode`, or a Score API refusal code passed through. */
  code: OptOutErrorCode | (string & {});
  message: string;
  httpStatus: number;
}

export type OptOutFailure = { ok: false; error: OptOutError };

export type OptOutResult = { ok: true; receipt: OptOutReceipt } | OptOutFailure;

/** A Safe request that was issued but never submitted, e.g. because its tab closed. */
export type SafeRequest = Pick<NonceRecord, 'action' | 'nonce' | 'issuedAt' | 'expiresAt'>;

/** Keyed by lowercase address; `null` when the address has no open Safe request. */
export type SafeRequests = Record<string, SafeRequest | null>;

/**
 * - `awaiting`: the Safe's owners have not reached its threshold yet.
 * - `signed`: the submission is ready for `submitOptOut`. Its signature is the
 *   owners' combined one, or `0x` once the Safe signed on-chain (SignMessageLib).
 */
export type SafeSignatureResult =
  | { ok: true; status: 'awaiting'; confirmations: number; threshold: number }
  | { ok: true; status: 'signed'; submission: OptOutSubmission }
  | OptOutFailure;

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
  not_a_safe: { message: 'This address is not a Safe.', httpStatus: 400 },
  safe_lookup_unavailable: {
    message: "The Safe's signatures could not be checked. Try again later.",
    httpStatus: 502,
  },
  onchain_signature_unsupported: {
    message:
      'Your Safe signed on-chain, which the Score API does not accept yet. Sign again with off-chain signing.',
    httpStatus: 409,
  },
};

function failure(code: OptOutErrorCode): OptOutFailure {
  return { ok: false, error: { code, ...ERRORS[code] } };
}

export function createOptOutService({
  nonces,
  scoreApi,
  verifySignature,
  safeTxService,
}: OptOutServiceDeps) {
  async function lookUpSafeSignature(typedData: OptOutTypedData): Promise<SafeSignatureResult> {
    const address = typedData.message.address;
    const info = await safeTxService.getSafe(address);
    if (!info) {
      return failure('not_a_safe');
    }
    const message = await safeTxService.getMessage(
      safeMessageHashOf(address, info.version, hashTypedData(typedData)),
    );
    const confirmations = message?.confirmations ?? 0;
    if (message?.preparedSignature && confirmations >= info.threshold) {
      return {
        ok: true,
        status: 'signed',
        submission: { typedData, signature: message.preparedSignature },
      };
    }
    // After SignMessageLib runs, isValidSignature(hash, 0x) passes.
    if (await verifySignature({ address, typedData, signature: '0x' })) {
      // The live Score API refuses `0x` (BenAffleck/ssv-scoring#24); submitting would use up the nonce.
      if (scoreApi.mode === 'live') {
        return failure('onchain_signature_unsupported');
      }
      return { ok: true, status: 'signed', submission: { typedData, signature: '0x' } };
    }
    return { ok: true, status: 'awaiting', confirmations, threshold: info.threshold };
  }

  return {
    mode: scoreApi.mode,

    issueNonce(address: string, action: OptOutAction): Promise<IssuedNonce> {
      return nonces.issue(address, action);
    },

    async submitOptOut({ typedData, signature }: OptOutSubmission): Promise<OptOutResult> {
      // Only the message is trusted from the client; domain and types are ours.
      const canonical = buildOptOutTypedData(typedData.message);
      const redeemed = await nonces.redeem(canonical.message, () =>
        verifySignature({ address: canonical.message.address, typedData: canonical, signature }),
      );
      if (!redeemed.ok) {
        return failure(redeemed.reason);
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

    /**
     * Looks up the finished signature of a Safe request whose signing tab may
     * have closed. The typed data is rebuilt from the nonce record, so it is the
     * message the owners signed.
     */
    async findSafeSignature(nonce: string): Promise<SafeSignatureResult> {
      const opened = await nonces.open(nonce);
      if (!opened.ok) {
        return failure(opened.reason);
      }
      const { record } = opened;
      const typedData = buildOptOutTypedData({
        address: getAddress(record.address),
        action: record.action,
        nonce: record.nonce,
        issuedAt: record.issuedAt,
      });
      try {
        return await lookUpSafeSignature(typedData);
      } catch (error) {
        console.error('Safe signature lookup failed:', error);
        return failure('safe_lookup_unavailable');
      }
    },

    /**
     * The latest request per address while unused. Only addresses the Safe
     * Transaction Service knows as Safes can have one.
     */
    async findSafeRequests(addresses: string[]): Promise<SafeRequests> {
      const entries = await Promise.all(
        addresses.map(async (address) => {
          const key = address.toLowerCase();
          const record = await nonces.latestUnused(key);
          if (!record || !(await safeTxService.getSafe(getAddress(key)))) {
            return [key, null] as const;
          }
          const { action, nonce, issuedAt, expiresAt } = record;
          const request: SafeRequest = { action, nonce, issuedAt, expiresAt };
          return [key, request] as const;
        }),
      );
      return Object.fromEntries(entries);
    },

    getStatuses(addresses: string[]): Promise<OptOutStatuses> {
      return scoreApi.getStatuses(addresses);
    },
  };
}

export type OptOutService = ReturnType<typeof createOptOutService>;
