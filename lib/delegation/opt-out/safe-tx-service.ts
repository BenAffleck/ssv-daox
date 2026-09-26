import { getAddress, hashTypedData, type Address, type Hex } from 'viem';

export interface SafeInfo {
  threshold: number;
  version: string;
}

export interface SafeMessage {
  confirmations: number;
  /** The owners' signatures, sorted and joined; valid once confirmations reach the threshold. */
  preparedSignature: Hex | null;
}

/** Safe Transaction Service reads for off-chain Safe messages, mainnet only. */
export interface SafeTransactionService {
  /** `null` when the address is not a Safe the service knows. */
  getSafe(address: Address): Promise<SafeInfo | null>;
  /** `null` until an owner proposes the message. */
  getMessage(safeMessageHash: Hex): Promise<SafeMessage | null>;
}

export interface SafeTransactionServiceDeps {
  /** e.g. `https://api.safe.global/tx-service/eth`, without trailing slash. */
  baseUrl: string;
  fetch: typeof fetch;
}

/**
 * The key the Safe Transaction Service files an off-chain message under: the
 * Safe's EIP-712 `SafeMessage` over the message's own EIP-712 hash.
 */
export function safeMessageHashOf(safe: Address, version: string, messageHash: Hex): Hex {
  // Safes before 1.3.0 leave chainId out of their domain.
  const domain = /^1\.[0-2]\./.test(version)
    ? { verifyingContract: safe }
    : { chainId: 1, verifyingContract: safe };
  return hashTypedData({
    domain,
    types: { SafeMessage: [{ name: 'message', type: 'bytes' }] },
    primaryType: 'SafeMessage',
    message: { message: messageHash },
  });
}

async function jsonOrNull(response: Response, resource: string): Promise<unknown> {
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Safe Transaction Service ${resource} failed with HTTP ${response.status}`);
  }
  return response.json();
}

export function createSafeTransactionService({
  baseUrl,
  fetch,
}: SafeTransactionServiceDeps): SafeTransactionService {
  return {
    async getSafe(address) {
      const response = await fetch(`${baseUrl}/api/v1/safes/${getAddress(address)}/`, {
        cache: 'no-store',
      });
      const body = (await jsonOrNull(response, 'safe')) as Partial<SafeInfo> | null;
      if (body === null) {
        return null;
      }
      if (typeof body.threshold !== 'number' || typeof body.version !== 'string') {
        throw new Error('Safe Transaction Service returned a malformed Safe');
      }
      return { threshold: body.threshold, version: body.version };
    },
    async getMessage(safeMessageHash) {
      const response = await fetch(`${baseUrl}/api/v1/messages/${safeMessageHash}/`, {
        cache: 'no-store',
      });
      const body = (await jsonOrNull(response, 'message')) as {
        confirmations?: unknown;
        preparedSignature?: unknown;
      } | null;
      if (body === null) {
        return null;
      }
      if (!Array.isArray(body.confirmations)) {
        throw new Error('Safe Transaction Service returned a malformed message');
      }
      const prepared = body.preparedSignature;
      return {
        confirmations: body.confirmations.length,
        preparedSignature:
          typeof prepared === 'string' && /^0x[0-9a-fA-F]+$/.test(prepared)
            ? (prepared as Hex)
            : null,
      };
    },
  };
}
