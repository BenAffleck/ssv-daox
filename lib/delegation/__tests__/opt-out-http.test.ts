import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { verifyTypedData, type Address } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createOptOutHttp } from '../opt-out/http';
import { createMockScoreApiClient } from '../opt-out/mock-score-api';
import { createMemoryNonceStore } from '../opt-out/nonce-store';
import { createSafeTransactionService } from '../opt-out/safe-tx-service';
import type { ScoreApiOptOutClient } from '../opt-out/score-api';
import { createOptOutService } from '../opt-out/service';
import { buildOptOutTypedData } from '../opt-out/typed-data';

const ALICE = privateKeyToAccount(
  '0x1111111111111111111111111111111111111111111111111111111111111111',
);
const BOB = privateKeyToAccount(
  '0x2222222222222222222222222222222222222222222222222222222222222222',
);

const BASE = 'http://daox.test/api/opt-out';

function post(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('opt-out HTTP', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'opt-out-http-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  function httpWith({
    rpcConfigured = true,
    maxRecords,
    scoreApi,
  }: { rpcConfigured?: boolean; maxRecords?: number; scoreApi?: ScoreApiOptOutClient } = {}) {
    const service = createOptOutService({
      nonces: createMemoryNonceStore({ maxRecords }),
      scoreApi: scoreApi ?? createMockScoreApiClient(path.join(dir, 'mock.json')),
      verifySignature: ({ address, typedData, signature }) =>
        verifyTypedData({ address, signature, ...typedData }),
      safeTxService: createSafeTransactionService({
        baseUrl: 'http://safe.test',
        fetch: async () => new Response('{}', { status: 404 }),
      }),
    });
    return createOptOutHttp({ service, rpcConfigured: () => rpcConfigured });
  }

  it('issues a nonce, accepts the signed request and reports it pending', async () => {
    const http = httpWith();

    const issued = await http.issueNonce(
      post(`${BASE}/nonce`, { address: ALICE.address, action: 'opt-out' }),
    );
    expect(issued.status).toBe(200);
    const { nonce, issuedAt } = await issued.json();
    const typedData = buildOptOutTypedData({
      address: ALICE.address,
      action: 'opt-out',
      nonce,
      issuedAt,
    });

    const submitted = await http.submit(
      post(BASE, { typedData, signature: await ALICE.signTypedData(typedData) }),
    );
    expect(submitted.status).toBe(200);
    expect(await submitted.json()).toEqual({
      address: ALICE.address,
      action: 'opt-out',
      status: 'pending',
    });

    const statuses = await http.statuses(new Request(`${BASE}/status?addresses=${ALICE.address}`));
    expect(await statuses.json()).toEqual({
      statuses: { [ALICE.address.toLowerCase()]: { action: 'opt-out', status: 'pending' } },
    });
  });

  async function issue(http: ReturnType<typeof httpWith>, address: Address = ALICE.address) {
    const response = await http.issueNonce(post(`${BASE}/nonce`, { address, action: 'opt-out' }));
    const { nonce, issuedAt } = await response.json();
    return buildOptOutTypedData({ address, action: 'opt-out', nonce, issuedAt });
  }

  async function submitSigned(http: ReturnType<typeof httpWith>, account: PrivateKeyAccount) {
    const typedData = await issue(http);
    return http.submit(
      post(BASE, { typedData, signature: await account.signTypedData(typedData) }),
    );
  }

  async function expectError(response: Response, status: number, code: string) {
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({
      error: { code, message: expect.stringMatching(/\S/) },
    });
  }

  it.each([
    ['a body that is not JSON', 'not json'],
    ['a malformed address', { address: '0x1234', action: 'opt-out' }],
    ['an unknown action', { address: ALICE.address, action: 'delete' }],
  ])('refuses a nonce request with %s', async (_case, body) => {
    await expectError(
      await httpWith().issueNonce(post(`${BASE}/nonce`, body)),
      400,
      'invalid_request',
    );
  });

  it('answers 429 once the nonce store is full', async () => {
    const http = httpWith({ maxRecords: 1 });
    await issue(http);

    await expectError(
      await http.issueNonce(post(`${BASE}/nonce`, { address: BOB.address, action: 'opt-out' })),
      429,
      'too_many_requests',
    );
  });

  it.each([
    ['a body that is not JSON', 'not json'],
    ['no signature', { typedData: { message: { address: ALICE.address } } }],
    [
      'a signature that is not hex',
      {
        typedData: {
          message: { address: ALICE.address, action: 'opt-out', nonce: 'n', issuedAt: 't' },
        },
        signature: 'signed-by-alice',
      },
    ],
  ])('refuses a submission with %s', async (_case, body) => {
    await expectError(await httpWith().submit(post(BASE, body)), 400, 'invalid_request');
  });

  it('refuses a signature from another account with 401, and a reused one with 409', async () => {
    const http = httpWith();
    await expectError(await submitSigned(http, BOB), 401, 'invalid_signature');

    const typedData = await issue(http);
    const body = { typedData, signature: await ALICE.signTypedData(typedData) };
    expect((await http.submit(post(BASE, body))).status).toBe(200);
    await expectError(await http.submit(post(BASE, body)), 409, 'nonce_used');
  });

  it("refuses a signature over another app's domain, whatever domain the client sends", async () => {
    const http = httpWith();
    const ours = await issue(http);
    const foreign = { ...ours, domain: { name: 'Other dApp', version: '1', chainId: 1 } } as const;

    const response = await http.submit(
      post(BASE, { typedData: foreign, signature: await ALICE.signTypedData(foreign) }),
    );

    await expectError(response, 401, 'invalid_signature');
  });

  it('refuses signed requests without an RPC, but still issues nonces', async () => {
    const http = httpWith({ rpcConfigured: false });

    expect(
      (await http.issueNonce(post(`${BASE}/nonce`, { address: ALICE.address, action: 'opt-out' })))
        .status,
    ).toBe(200);
    await expectError(await submitSigned(http, ALICE), 503, 'rpc_unconfigured');
    await expectError(
      await http.safeSignature(new Request(`${BASE}/safe-signature?nonce=abc`)),
      503,
      'rpc_unconfigured',
    );
  });

  it('refuses a Safe signature lookup without a known nonce', async () => {
    const http = httpWith();

    await expectError(
      await http.safeSignature(new Request(`${BASE}/safe-signature`)),
      400,
      'invalid_request',
    );
    await expectError(
      await http.safeSignature(new Request(`${BASE}/safe-signature?nonce=abc`)),
      400,
      'unknown_nonce',
    );
  });

  it('refuses a status batch with a non-address or more than 100 addresses', async () => {
    const http = httpWith();
    const many = Array.from({ length: 101 }, (_, i) => `0x${i.toString(16).padStart(40, '0')}`);

    await expectError(
      await http.statuses(new Request(`${BASE}/status?addresses=${ALICE.address},alice.eth`)),
      400,
      'invalid_request',
    );
    await expectError(
      await http.statuses(new Request(`${BASE}/status?addresses=${many.join(',')}`)),
      400,
      'invalid_request',
    );
  });

  it('answers 502 when the Score API status lookup fails', async () => {
    const http = httpWith({
      scoreApi: {
        mode: 'live',
        submit: async () => {
          throw new Error('unused');
        },
        getStatuses: async () => {
          throw new Error('Score API down');
        },
      },
    });

    await expectError(
      await http.statuses(new Request(`${BASE}/status?addresses=${ALICE.address}`)),
      502,
      'score_api_unavailable',
    );
  });
});
