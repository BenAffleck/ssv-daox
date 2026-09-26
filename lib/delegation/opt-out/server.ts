import path from 'path';
import { unstable_rethrow } from 'next/navigation';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

import { DELEGATE_SCORE_CONFIG } from '@/lib/dao-delegates/config';
import { getMainnetRpcUrl } from '@/lib/wallet/config';

import { OPT_OUT_CONFIG } from './config';
import { createFileNonceStore } from './file-nonce-store';
import { createMockScoreApiClient } from './mock-score-api';
import { createSafeTransactionService } from './safe-tx-service';
import { createScoreApiClient, type OptOutStatuses } from './score-api';
import {
  createOptOutService,
  type OptOutService,
  type SafeRequests,
  type SignatureVerifier,
} from './service';

/**
 * Verifies through the mainnet RPC, so EIP-1271 contract wallets (Safe) work
 * as well as EOAs.
 */
function createRpcVerifier(rpcUrl: string): SignatureVerifier {
  if (!rpcUrl) {
    // viem's http('') would fall back to a public RPC.
    return async () => {
      throw new Error('MAINNET_RPC_URL is not configured');
    };
  }
  const client = createPublicClient({ chain: mainnet, transport: http(rpcUrl) });
  return ({ address, typedData, signature }) =>
    client.verifyTypedData({
      address,
      signature,
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: { ...typedData.message },
      blockTag: 'latest',
    });
}

let service: OptOutService | null = null;

/**
 * The opt-out service wired to the file-backed stores. One instance per
 * process, so its file writes are serialized. Requires `MAINNET_RPC_URL`
 * for submissions.
 */
export function getOptOutService(): OptOutService {
  service ??= createOptOutService({
    nonces: createFileNonceStore(path.join(process.cwd(), OPT_OUT_CONFIG.nonceFilePath)),
    scoreApi: OPT_OUT_CONFIG.mockEnabled
      ? createMockScoreApiClient(path.join(process.cwd(), OPT_OUT_CONFIG.mockFilePath))
      : createScoreApiClient({ baseUrl: DELEGATE_SCORE_CONFIG.apiBaseUrl, fetch }),
    verifySignature: createRpcVerifier(getMainnetRpcUrl()),
    safeTxService: createSafeTransactionService({
      baseUrl: OPT_OUT_CONFIG.safeTxServiceUrl,
      fetch,
    }),
  });
  return service;
}

/**
 * The statuses of `addresses` in one batched lookup. Returns `{}` when the
 * lookup fails, so pages render without opt-out badges.
 */
export async function fetchOptOutStatuses(addresses: string[]): Promise<OptOutStatuses> {
  try {
    return await getOptOutService().getStatuses(addresses);
  } catch (error) {
    // A no-store fetch throws during prerender to make the route dynamic.
    unstable_rethrow(error);
    console.error('Opt-out status lookup failed:', error);
    return {};
  }
}

/**
 * The open Safe requests of `addresses`. Returns `{}` when the lookup fails,
 * so pages render without the "awaiting co-signers" state.
 */
export async function fetchSafeRequests(addresses: string[]): Promise<SafeRequests> {
  try {
    return await getOptOutService().findSafeRequests(addresses);
  } catch (error) {
    unstable_rethrow(error);
    console.error('Safe request lookup failed:', error);
    return {};
  }
}
