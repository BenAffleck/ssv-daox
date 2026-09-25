import type { OptOutAction, OptOutSubmission } from './typed-data';

/**
 * An address's latest request. `applied` once a published score run has
 * applied it; an applied opt-out lasts until an opt-in.
 */
export interface OptOutStatus {
  action: OptOutAction;
  status: 'pending' | 'applied';
}

/** The Score API's answer to an accepted opt-out or opt-in request. */
export interface OptOutReceipt {
  address: string;
  action: OptOutAction;
  status: 'pending';
}

/** Statuses keyed by lowercase address; `null` when the address sent no request. */
export type OptOutStatuses = Record<string, OptOutStatus | null>;

/**
 * Score API opt-out endpoints. `mock` means requests are recorded locally and
 * never reach the Score API, so the UI shows a "Demo" banner.
 */
export type OptOutMode = 'mock' | 'live';

export interface ScoreApiOptOutClient {
  mode: OptOutMode;
  submit(submission: OptOutSubmission): Promise<OptOutReceipt>;
  getStatuses(addresses: string[]): Promise<OptOutStatuses>;
}

export interface ScoreApiClientDeps {
  /** `DELEGATE_SCORE_API_URL` without trailing slash. */
  baseUrl: string;
  fetch: typeof fetch;
}

/** A 4xx from the Score API with its `{ error: { code, message } }` body. */
export class ScoreApiRefusal extends Error {
  name = 'ScoreApiRefusal';

  constructor(
    readonly httpStatus: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function errorBodyOf(body: unknown): { code: string; message: string } | null {
  const error = (body as { error?: unknown } | null)?.error as
    { code?: unknown; message?: unknown } | undefined;
  return typeof error?.code === 'string' && typeof error.message === 'string'
    ? { code: error.code, message: error.message }
    : null;
}

async function json(response: Response, what: string): Promise<unknown> {
  if (response.status >= 400 && response.status < 500) {
    const error = errorBodyOf(await response.json().catch(() => null));
    if (error) {
      throw new ScoreApiRefusal(response.status, error.code, error.message);
    }
  }
  if (!response.ok) {
    throw new Error(`Score API ${what} failed with HTTP ${response.status}`);
  }
  return response.json();
}

function isAction(value: unknown): value is OptOutAction {
  return value === 'opt-out' || value === 'opt-in';
}

function isStatus(value: unknown): value is OptOutStatus {
  const status = value as Partial<OptOutStatus> | null;
  return isAction(status?.action) && (status.status === 'pending' || status.status === 'applied');
}

function isReceipt(body: unknown): body is OptOutReceipt {
  const receipt = body as Partial<OptOutReceipt> | null;
  return (
    typeof receipt?.address === 'string' && isAction(receipt.action) && receipt.status === 'pending'
  );
}

/** The Score API refuses more addresses per status request. */
export const MAX_STATUS_ADDRESSES = 100;

/**
 * Score API opt-out endpoints: `POST /v1/opt-out`, `GET /v1/opt-out/status`.
 * The contract is the Score API's `docs/architecture.md` and `/openapi.json`.
 */
export function createScoreApiClient({ baseUrl, fetch }: ScoreApiClientDeps): ScoreApiOptOutClient {
  async function statusBatch(addresses: string[]): Promise<Map<string, OptOutStatus>> {
    const query = addresses.map(encodeURIComponent).join(',');
    const response = await fetch(`${baseUrl}/v1/opt-out/status?addresses=${query}`, {
      cache: 'no-store',
    });
    const { statuses } = ((await json(response, 'opt-out status')) ?? {}) as {
      statuses?: unknown;
    };
    if (typeof statuses !== 'object' || statuses === null) {
      throw new Error('Score API opt-out status returned a malformed body');
    }
    return new Map(
      Object.entries(statuses).flatMap(([address, status]) =>
        isStatus(status) ? [[address.toLowerCase(), status] as const] : [],
      ),
    );
  }

  return {
    mode: 'live',
    async submit(submission) {
      const response = await fetch(`${baseUrl}/v1/opt-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      const body = await json(response, 'opt-out');
      if (!isReceipt(body)) {
        throw new Error('Score API opt-out returned a malformed receipt');
      }
      return body;
    },
    async getStatuses(addresses) {
      const batches: string[][] = [];
      for (let i = 0; i < addresses.length; i += MAX_STATUS_ADDRESSES) {
        batches.push(addresses.slice(i, i + MAX_STATUS_ADDRESSES));
      }
      const found = await Promise.all(batches.map(statusBatch));
      const byAddress = new Map(found.flatMap((batch) => [...batch]));
      return Object.fromEntries(
        addresses.map((a) => [a.toLowerCase(), byAddress.get(a.toLowerCase()) ?? null]),
      );
    },
  };
}
