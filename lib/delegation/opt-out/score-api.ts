import type { OptOutAction, OptOutSubmission } from './typed-data';

/** A request the Score API has received but not yet applied in a score run. */
export interface OptOutStatus {
  action: OptOutAction;
  status: 'pending';
}

/** The Score API's answer to an accepted opt-out or opt-in request. */
export type OptOutReceipt = OptOutStatus & { address: string };

/** Statuses keyed by lowercase address; `null` when nothing is pending. */
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

async function json(response: Response, what: string): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`Score API ${what} failed with HTTP ${response.status}`);
  }
  return response.json();
}

/** Proposed Score API contract: `POST /v1/opt-out`, `GET /v1/opt-out/status`. */
export function createScoreApiClient({ baseUrl, fetch }: ScoreApiClientDeps): ScoreApiOptOutClient {
  return {
    mode: 'live',
    async submit(submission) {
      const response = await fetch(`${baseUrl}/v1/opt-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      return (await json(response, 'opt-out')) as OptOutReceipt;
    },
    async getStatuses(addresses) {
      const query = addresses.map(encodeURIComponent).join(',');
      const response = await fetch(`${baseUrl}/v1/opt-out/status?addresses=${query}`, {
        cache: 'no-store',
      });
      const { statuses } = (await json(response, 'opt-out status')) as {
        statuses: OptOutStatuses;
      };
      const byAddress = new Map(
        Object.entries(statuses).map(([address, status]) => [address.toLowerCase(), status]),
      );
      return Object.fromEntries(
        addresses.map((a) => [a.toLowerCase(), byAddress.get(a.toLowerCase()) ?? null]),
      );
    },
  };
}
