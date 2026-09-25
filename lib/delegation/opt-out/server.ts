import path from 'path';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

import { DELEGATE_SCORE_CONFIG } from '@/lib/dao-delegates/config';
import { getMainnetRpcUrl } from '@/lib/wallet/config';

import { OPT_OUT_CONFIG } from './config';
import { createFileNonceStore } from './file-nonce-store';
import { createMockScoreApiClient } from './mock-score-api';
import { createScoreApiClient } from './score-api';
import { createOptOutService, type OptOutService, type SignatureVerifier } from './service';

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
  });
  return service;
}
