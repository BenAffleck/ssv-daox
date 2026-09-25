import { createJsonFile } from './json-file';
import type { NonceRecord, NonceStore } from './service';

interface NonceFile {
  nonces: Record<string, NonceRecord>;
}

// Kept past expiry so a late submission is reported as expired, not unknown.
const RETENTION_AFTER_EXPIRY_MS = 24 * 60 * 60 * 1000;
/** Bounds the file (about 2 MB) against a flood of nonce requests. */
const MAX_RECORDS = 10_000;

export class NonceStoreFullError extends Error {
  name = 'NonceStoreFullError';
}

/**
 * Nonces in a JSON file. Records are pruned a day after they expire, and the
 * file holds at most `MAX_RECORDS`.
 */
export function createFileNonceStore(filePath: string): NonceStore {
  const file = createJsonFile<NonceFile>(filePath, () => ({ nonces: {} }));

  return {
    save(record) {
      return file.update((data) => {
        const cutoff = Date.parse(record.issuedAt) - RETENTION_AFTER_EXPIRY_MS;
        for (const [nonce, existing] of Object.entries(data.nonces)) {
          if (Date.parse(existing.expiresAt) < cutoff) {
            delete data.nonces[nonce];
          }
        }
        if (Object.keys(data.nonces).length >= MAX_RECORDS) {
          throw new NonceStoreFullError('Too many opt-out requests. Try again later.');
        }
        data.nonces[record.nonce] = record;
      });
    },
    async find(nonce) {
      const { nonces } = await file.read();
      return nonces[nonce] ?? null;
    },
    markUsed(nonce) {
      return file.update((data) => {
        const record = data.nonces[nonce];
        if (!record || record.used) {
          return false;
        }
        record.used = true;
        return true;
      });
    },
  };
}
