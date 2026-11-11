import { isAddress } from 'viem';

import { NonceStoreFullError } from './nonce-store';
import { nonceRequestSchema, parseSubmission, safeSignatureQuerySchema } from './schema';
import { MAX_STATUS_ADDRESSES } from './score-api';
import type { OptOutError, OptOutService } from './service';

export interface OptOutHttpDeps {
  service: OptOutService;
  /** Signature checks need `MAINNET_RPC_URL`; without it, signed requests answer `503`. */
  rpcConfigured: () => boolean;
}

/** The error body every opt-out route returns: `{ error: { code, message } }`. */
function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

const fromError = ({ httpStatus, code, message }: OptOutError) =>
  errorResponse(httpStatus, code, message);

const rpcUnconfigured = () =>
  errorResponse(503, 'rpc_unconfigured', 'Signature checks need MAINNET_RPC_URL.');

const readJson = (request: Request): Promise<unknown> => request.json().catch(() => null);

/** The opt-out routes as Request → Response handlers over one service. */
export function createOptOutHttp({ service, rpcConfigured }: OptOutHttpDeps) {
  return {
    /** POST `{ address, action }` → `{ nonce, issuedAt }`. */
    async issueNonce(request: Request): Promise<Response> {
      const parsed = nonceRequestSchema.safeParse(await readJson(request));
      if (!parsed.success) {
        return errorResponse(
          400,
          'invalid_request',
          'The request needs an Ethereum address and an action.',
        );
      }
      try {
        return Response.json(await service.issueNonce(parsed.data.address, parsed.data.action));
      } catch (error) {
        if (error instanceof NonceStoreFullError) {
          return errorResponse(429, 'too_many_requests', error.message);
        }
        throw error;
      }
    },

    /** POST `{ typedData, signature }` → the Score API receipt. */
    async submit(request: Request): Promise<Response> {
      if (!rpcConfigured()) {
        return rpcUnconfigured();
      }
      const submission = parseSubmission(await readJson(request));
      if (!submission) {
        return errorResponse(400, 'invalid_request', 'The request is malformed.');
      }
      const result = await service.submitOptOut(submission);
      return result.ok ? Response.json(result.receipt) : fromError(result.error);
    },

    /** GET `?nonce=` → the Safe request's finished submission, or its confirmations so far. */
    async safeSignature(request: Request): Promise<Response> {
      if (!rpcConfigured()) {
        return rpcUnconfigured();
      }
      const parsed = safeSignatureQuerySchema.safeParse({
        nonce: new URL(request.url).searchParams.get('nonce'),
      });
      if (!parsed.success) {
        return errorResponse(400, 'invalid_request', 'The request needs a nonce.');
      }
      const result = await service.findSafeSignature(parsed.data.nonce);
      if (!result.ok) {
        return fromError(result.error);
      }
      return Response.json(
        result.status === 'signed'
          ? { status: 'signed', submission: result.submission }
          : {
              status: 'awaiting',
              confirmations: result.confirmations,
              threshold: result.threshold,
            },
      );
    },

    /** GET `?addresses=0x…,0x…` → `{ statuses }`, the latest request per address. */
    async statuses(request: Request): Promise<Response> {
      const param = new URL(request.url).searchParams.get('addresses') ?? '';
      const addresses = param.split(',').filter(Boolean);
      if (addresses.length > MAX_STATUS_ADDRESSES) {
        return errorResponse(
          400,
          'invalid_request',
          `At most ${MAX_STATUS_ADDRESSES} addresses per request.`,
        );
      }
      if (!addresses.every((a) => isAddress(a, { strict: false }))) {
        return errorResponse(400, 'invalid_request', 'The addresses are not Ethereum addresses.');
      }
      try {
        return Response.json({ statuses: await service.getStatuses(addresses) });
      } catch (error) {
        console.error('Opt-out status lookup failed:', error);
        return errorResponse(502, 'score_api_unavailable', 'The Score API is unavailable.');
      }
    },
  };
}

export type OptOutHttp = ReturnType<typeof createOptOutHttp>;
