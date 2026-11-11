import { randomBytes } from 'crypto';

import { createJsonFile } from '@/lib/json-file';

import type { OptOutAction, OptOutMessage } from './typed-data';

/** Matches the Score API's window, so Safe co-signers have time. */
const NONCE_TTL_MS = 24 * 60 * 60 * 1000;
// Kept past expiry so a late submission is reported as expired, not unknown.
const RETENTION_AFTER_EXPIRY_MS = 24 * 60 * 60 * 1000;
/** Bounds the store (about 2 MB as a file) against a flood of nonce requests. */
const DEFAULT_MAX_RECORDS = 10_000;

export interface NonceRecord {
  nonce: string;
  /** Lowercase address the nonce was issued to. */
  address: string;
  action: OptOutAction;
  issuedAt: string;
  expiresAt: string;
  used: boolean;
}

export interface IssuedNonce {
  nonce: string;
  issuedAt: string;
}

/** Why a redemption failed; each is an opt-out error code. */
export type RedemptionFailure =
  | 'unknown_nonce'
  | 'nonce_address_mismatch'
  | 'nonce_mismatch'
  | 'nonce_expired'
  | 'nonce_used'
  | 'invalid_signature';

export type OpenNonce =
  | { ok: true; record: NonceRecord }
  | {
      ok: false;
      reason: Extract<RedemptionFailure, 'unknown_nonce' | 'nonce_expired' | 'nonce_used'>;
    };

export type Redemption = { ok: true } | { ok: false; reason: RedemptionFailure };

export class NonceStoreFullError extends Error {
  name = 'NonceStoreFullError';
}

/**
 * Single-use opt-out nonces. A nonce is issued for one address and action,
 * expires after a day, and redeems at most once.
 */
export interface NonceStore {
  /** Throws `NonceStoreFullError` when the store holds too many records. */
  issue(address: string, action: OptOutAction): Promise<IssuedNonce>;
  /** The record of a nonce that is still usable. */
  open(nonce: string): Promise<OpenNonce>;
  /**
   * Redeems `message`'s nonce when the message matches what was issued and
   * `isAuthentic` confirms its signature. Of concurrent redemptions, one wins.
   */
  redeem(message: OptOutMessage, isAuthentic: () => Promise<boolean>): Promise<Redemption>;
  /** The most recently issued record of an address while unused, expired or not. */
  latestUnused(address: string): Promise<NonceRecord | null>;
}

interface NonceDocument {
  nonces: Record<string, NonceRecord>;
}

/** Storage with serialized read-modify-write, as `createJsonFile` provides. */
interface DocumentStorage {
  read(): Promise<NonceDocument>;
  update<R>(change: (data: NonceDocument) => R): Promise<R>;
}

export interface NonceStoreOptions {
  now?: () => Date;
  /** Records the store holds before `issue` throws `NonceStoreFullError`. */
  maxRecords?: number;
}

function createNonceStore(
  storage: DocumentStorage,
  { now = () => new Date(), maxRecords = DEFAULT_MAX_RECORDS }: NonceStoreOptions,
): NonceStore {
  const isExpired = (record: NonceRecord) => now().getTime() > Date.parse(record.expiresAt);

  function usability(record: NonceRecord | undefined): OpenNonce {
    if (!record) {
      return { ok: false, reason: 'unknown_nonce' };
    }
    if (isExpired(record)) {
      return { ok: false, reason: 'nonce_expired' };
    }
    if (record.used) {
      return { ok: false, reason: 'nonce_used' };
    }
    return { ok: true, record };
  }

  async function open(nonce: string): Promise<OpenNonce> {
    return usability((await storage.read()).nonces[nonce]);
  }

  return {
    async issue(address, action) {
      const issued = now();
      const record: NonceRecord = {
        nonce: randomBytes(16).toString('hex'),
        address: address.toLowerCase(),
        action,
        issuedAt: issued.toISOString(),
        expiresAt: new Date(issued.getTime() + NONCE_TTL_MS).toISOString(),
        used: false,
      };
      await storage.update((data) => {
        const cutoff = issued.getTime() - RETENTION_AFTER_EXPIRY_MS;
        for (const [nonce, existing] of Object.entries(data.nonces)) {
          if (Date.parse(existing.expiresAt) < cutoff) {
            delete data.nonces[nonce];
          }
        }
        if (Object.keys(data.nonces).length >= maxRecords) {
          throw new NonceStoreFullError('Too many opt-out requests. Try again later.');
        }
        data.nonces[record.nonce] = record;
      });
      return { nonce: record.nonce, issuedAt: record.issuedAt };
    },

    open,

    async redeem(message, isAuthentic) {
      const record = (await storage.read()).nonces[message.nonce];
      if (!record) {
        return { ok: false, reason: 'unknown_nonce' };
      }
      if (record.address !== message.address.toLowerCase()) {
        return { ok: false, reason: 'nonce_address_mismatch' };
      }
      if (record.issuedAt !== message.issuedAt || record.action !== message.action) {
        return { ok: false, reason: 'nonce_mismatch' };
      }
      const usable = usability(record);
      if (!usable.ok) {
        return usable;
      }
      if (!(await isAuthentic())) {
        return { ok: false, reason: 'invalid_signature' };
      }
      const won = await storage.update((data) => {
        const current = data.nonces[message.nonce];
        if (!current || current.used) {
          return false;
        }
        current.used = true;
        return true;
      });
      return won ? { ok: true } : { ok: false, reason: 'nonce_used' };
    },

    async latestUnused(address) {
      const key = address.toLowerCase();
      let latest: NonceRecord | null = null;
      for (const record of Object.values((await storage.read()).nonces)) {
        if (record.address === key && (!latest || record.issuedAt > latest.issuedAt)) {
          latest = record;
        }
      }
      return latest && !latest.used ? latest : null;
    },
  };
}

/** Nonces in a JSON file; one process MUST own the file. */
export function createFileNonceStore(
  filePath: string,
  options: NonceStoreOptions = {},
): NonceStore {
  return createNonceStore(
    createJsonFile<NonceDocument>(filePath, () => ({ nonces: {} })),
    options,
  );
}

/** Nonces in memory, for tests and tools. */
export function createMemoryNonceStore(options: NonceStoreOptions = {}): NonceStore {
  let data: NonceDocument = { nonces: {} };
  const copy = (doc: NonceDocument): NonceDocument => structuredClone(doc);
  return createNonceStore(
    {
      async read() {
        return copy(data);
      },
      async update(change) {
        const next = copy(data);
        const result = change(next);
        data = next;
        return result;
      },
    },
    options,
  );
}
