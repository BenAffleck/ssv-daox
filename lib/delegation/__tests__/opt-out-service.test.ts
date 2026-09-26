import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { hashTypedData, verifyTypedData, type Address, type Hex } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMockScoreApiClient } from '../opt-out/mock-score-api';
import { createSafeTransactionService } from '../opt-out/safe-tx-service';
import { createScoreApiClient } from '../opt-out/score-api';
import {
  createOptOutService,
  type NonceRecord,
  type NonceStore,
  type OptOutServiceDeps,
  type SignatureVerifier,
} from '../opt-out/service';
import {
  buildOptOutTypedData,
  type OptOutAction,
  type OptOutTypedData,
} from '../opt-out/typed-data';

const ALICE = privateKeyToAccount(
  '0x1111111111111111111111111111111111111111111111111111111111111111',
);
const BOB = privateKeyToAccount(
  '0x2222222222222222222222222222222222222222222222222222222222222222',
);
const CAROL = '0xca401ca401ca401ca401ca401ca401ca401ca401';

function memoryNonceStore(): NonceStore {
  const records = new Map<string, NonceRecord>();
  return {
    async save(record) {
      records.set(record.nonce, { ...record });
    },
    async find(nonce) {
      return records.get(nonce) ?? null;
    },
    async findLatest(address) {
      const own = [...records.values()].filter((r) => r.address === address);
      return own.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt)).at(-1) ?? null;
    },
    async markUsed(nonce) {
      const record = records.get(nonce);
      if (!record || record.used) {
        return false;
      }
      record.used = true;
      return true;
    },
  };
}

const verifyEoa: SignatureVerifier = ({ address, typedData, signature }) =>
  verifyTypedData({ address, signature, ...typedData });

describe('opt-out service', () => {
  let dir: string;
  let clock: Date;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'opt-out-'));
    clock = new Date('2026-09-25T12:00:00.000Z');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  function serviceWith({
    scoreApi = createMockScoreApiClient(path.join(dir, 'opt-out-mock.json')),
    verifySignature = verifyEoa,
    safeFetch = async () => new Response('{}', { status: 404 }),
  }: Partial<Pick<OptOutServiceDeps, 'scoreApi' | 'verifySignature'>> & {
    safeFetch?: typeof fetch;
  } = {}) {
    return createOptOutService({
      nonces: memoryNonceStore(),
      scoreApi,
      verifySignature,
      safeTxService: createSafeTransactionService({
        baseUrl: 'http://safe.test',
        fetch: safeFetch,
      }),
      now: () => clock,
    });
  }

  const mockService = () => serviceWith();

  async function signed(
    service: ReturnType<typeof mockService>,
    account: PrivateKeyAccount,
    action: OptOutAction,
    address: Address = account.address,
  ) {
    const { nonce, issuedAt } = await service.issueNonce(address, action);
    const typedData = buildOptOutTypedData({ address, action, nonce, issuedAt });
    return { typedData, signature: await account.signTypedData(typedData) };
  }

  it('records a valid opt-out as pending, then reverses it with an opt-in', async () => {
    const service = mockService();

    const optOut = await service.submitOptOut(await signed(service, ALICE, 'opt-out'));
    expect(optOut).toEqual({
      ok: true,
      receipt: { address: ALICE.address, action: 'opt-out', status: 'pending' },
    });
    expect(await service.getStatuses([ALICE.address, BOB.address])).toEqual({
      [ALICE.address.toLowerCase()]: { action: 'opt-out', status: 'pending' },
      [BOB.address.toLowerCase()]: null,
    });

    const optIn = await service.submitOptOut(await signed(service, ALICE, 'opt-in'));
    expect(optIn.ok).toBe(true);
    expect(await service.getStatuses([ALICE.address])).toEqual({
      [ALICE.address.toLowerCase()]: { action: 'opt-in', status: 'pending' },
    });
  });

  it('rejects a reused nonce', async () => {
    const service = mockService();
    const submission = await signed(service, ALICE, 'opt-out');
    await service.submitOptOut(submission);

    expect(await service.submitOptOut(submission)).toMatchObject({
      ok: false,
      error: { code: 'nonce_used' },
    });
  });

  it('accepts a nonce up to a day old, so Safe co-signers have time, and rejects it after', async () => {
    const service = mockService();
    const fresh = await signed(service, ALICE, 'opt-out');
    const stale = await signed(service, BOB, 'opt-out');

    clock = new Date('2026-09-26T12:00:00.000Z');
    expect((await service.submitOptOut(fresh)).ok).toBe(true);

    clock = new Date('2026-09-26T12:00:00.001Z');
    expect(await service.submitOptOut(stale)).toMatchObject({
      ok: false,
      error: { code: 'nonce_expired' },
    });
  });

  it("rejects a nonce issued to a different address, even with the address owner's signature", async () => {
    const service = mockService();
    const { nonce, issuedAt } = await service.issueNonce(BOB.address, 'opt-out');
    const typedData = buildOptOutTypedData({
      address: ALICE.address,
      action: 'opt-out',
      nonce,
      issuedAt,
    });

    const result = await service.submitOptOut({
      typedData,
      signature: await ALICE.signTypedData(typedData),
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'nonce_address_mismatch' } });
    expect(await service.getStatuses([ALICE.address])).toEqual({
      [ALICE.address.toLowerCase()]: null,
    });
  });

  it('rejects a signed timestamp other than the one issued with the nonce', async () => {
    const service = mockService();
    const { nonce } = await service.issueNonce(ALICE.address, 'opt-out');
    const typedData = buildOptOutTypedData({
      address: ALICE.address,
      action: 'opt-out',
      nonce,
      issuedAt: '2030-01-01T00:00:00.000Z',
    });

    const result = await service.submitOptOut({
      typedData,
      signature: await ALICE.signTypedData(typedData),
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'nonce_mismatch' } });
  });

  it('rejects a signature from another account', async () => {
    const service = mockService();
    const { typedData } = await signed(service, ALICE, 'opt-out');

    const result = await service.submitOptOut({
      typedData,
      signature: await BOB.signTypedData(typedData),
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'invalid_signature' } });
    expect(await service.getStatuses([ALICE.address])).toEqual({
      [ALICE.address.toLowerCase()]: null,
    });
  });

  it('accepts a contract wallet signature that the verifier validates via EIP-1271', async () => {
    const SAFE: Address = '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe';
    // Stands in for the Safe's isValidSignature: it accepts its owner's signature.
    const safeOwnedByAlice: SignatureVerifier = ({ address, typedData, signature }) =>
      address.toLowerCase() === SAFE
        ? verifyTypedData({ address: ALICE.address, signature, ...typedData })
        : verifyEoa({ address, typedData, signature });
    const service = serviceWith({ verifySignature: safeOwnedByAlice });

    const byOwner = await service.submitOptOut(await signed(service, ALICE, 'opt-out', SAFE));
    const byStranger = await service.submitOptOut(await signed(service, BOB, 'opt-out', SAFE));

    expect(byOwner).toEqual({
      ok: true,
      receipt: { address: SAFE, action: 'opt-out', status: 'pending' },
    });
    expect(byStranger).toMatchObject({ ok: false, error: { code: 'invalid_signature' } });
  });

  describe('Score API client', () => {
    it('in mock mode, keeps requests in a file that survives a restart', async () => {
      const service = mockService();
      await service.submitOptOut(await signed(service, ALICE, 'opt-out'));

      const restarted = createMockScoreApiClient(path.join(dir, 'opt-out-mock.json'));

      expect(service.mode).toBe('mock');
      expect(await restarted.getStatuses([ALICE.address])).toEqual({
        [ALICE.address.toLowerCase()]: { action: 'opt-out', status: 'pending' },
      });
    });

    it('in live mode, forwards the verified request and reads pending and applied statuses', async () => {
      const requests: { url: string; init?: RequestInit }[] = [];
      const fetchStub: typeof fetch = async (input, init) => {
        const url = String(input);
        requests.push({ url, init });
        const body = url.includes('/status')
          ? {
              statuses: {
                [ALICE.address]: { action: 'opt-out', status: 'applied' },
                [BOB.address.toLowerCase()]: { action: 'opt-in', status: 'pending' },
              },
            }
          : { address: ALICE.address, action: 'opt-out', status: 'pending' };
        return new Response(JSON.stringify(body), { status: 200 });
      };
      const service = serviceWith({
        scoreApi: createScoreApiClient({ baseUrl: 'http://score.test', fetch: fetchStub }),
      });
      const submission = await signed(service, ALICE, 'opt-out');

      const result = await service.submitOptOut(submission);
      const statuses = await service.getStatuses([ALICE.address, BOB.address, CAROL]);

      expect(service.mode).toBe('live');
      expect(result).toEqual({
        ok: true,
        receipt: { address: ALICE.address, action: 'opt-out', status: 'pending' },
      });
      expect(requests[0].url).toBe('http://score.test/v1/opt-out');
      expect(requests[0].init?.method).toBe('POST');
      expect(JSON.parse(String(requests[0].init?.body))).toEqual(submission);
      expect(requests[1].url).toBe(
        `http://score.test/v1/opt-out/status?addresses=${ALICE.address},${BOB.address},${CAROL}`,
      );
      expect(statuses).toEqual({
        [ALICE.address.toLowerCase()]: { action: 'opt-out', status: 'applied' },
        [BOB.address.toLowerCase()]: { action: 'opt-in', status: 'pending' },
        [CAROL]: null,
      });
    });

    function liveServiceAnswering(answer: typeof fetch) {
      return serviceWith({
        scoreApi: createScoreApiClient({ baseUrl: 'http://score.test', fetch: answer }),
      });
    }

    it('looks statuses up in batches of 100, the Score API cap', async () => {
      const addresses = Array.from(
        { length: 150 },
        (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}`,
      );
      const batchSizes: number[] = [];
      const service = liveServiceAnswering(async (input) => {
        const batch = new URL(String(input)).searchParams.get('addresses')!.split(',');
        batchSizes.push(batch.length);
        const statuses = Object.fromEntries(
          batch.map((a) => [a, { action: 'opt-out', status: 'applied' }]),
        );
        return new Response(JSON.stringify({ statuses }), { status: 200 });
      });

      const statuses = await service.getStatuses(addresses);

      expect(batchSizes).toEqual([100, 50]);
      expect(statuses[addresses[149]]).toEqual({ action: 'opt-out', status: 'applied' });
    });

    function refusal(status: number, code: string, message: string) {
      return async () => new Response(JSON.stringify({ error: { code, message } }), { status });
    }

    it.each([
      [409, 'superseded', 'A later request was already accepted for this address.'],
      [400, 'expired', 'issuedAt is more than 1 day old.'],
    ])(
      'passes a %i %s refusal through with its code and message',
      async (status, code, message) => {
        const service = liveServiceAnswering(refusal(status, code, message));

        expect(await service.submitOptOut(await signed(service, ALICE, 'opt-out'))).toEqual({
          ok: false,
          error: { code, message, httpStatus: status },
        });
      },
    );

    it.each([
      ['a 5xx', refusal(503, 'unavailable', 'Database busy')],
      ['a 4xx without an error body', async () => new Response('nope', { status: 404 })],
      [
        'a network failure',
        async () => {
          throw new TypeError('fetch failed');
        },
      ],
      ['a malformed success body', async () => new Response('not json', { status: 200 })],
    ])('reports %s as an unavailable Score API', async (_, answer) => {
      const service = liveServiceAnswering(answer);

      expect(await service.submitOptOut(await signed(service, ALICE, 'opt-out'))).toMatchObject({
        ok: false,
        error: { code: 'score_api_unavailable', httpStatus: 502 },
      });
    });
  });

  describe('Safe resume', () => {
    const SAFE: Address = '0x5afe5afE5afE5afE5afE5aFe5aFe5Afe5Afe5AfE';
    const OWNER_SIGNATURE = `0x${'ab'.repeat(65)}` as Hex;

    /** The Safe's EIP-712 `SafeMessage` hash, the Safe Transaction Service's message key. */
    function safeMessageHashOf(typedData: OptOutTypedData): Hex {
      return hashTypedData({
        domain: { chainId: 1, verifyingContract: SAFE },
        types: { SafeMessage: [{ name: 'message', type: 'bytes' }] },
        primaryType: 'SafeMessage',
        message: { message: hashTypedData({ ...typedData, message: { ...typedData.message } }) },
      });
    }

    /** A Safe Transaction Service holding a 2-of-3 Safe and, optionally, one message. */
    function safeServiceWith(message?: { hash: () => Hex; confirmations: number }): typeof fetch {
      return async (input) => {
        const url = String(input);
        if (url === `http://safe.test/api/v1/safes/${SAFE}/`) {
          return Response.json({ address: SAFE, threshold: 2, version: '1.3.0' });
        }
        if (message && url === `http://safe.test/api/v1/messages/${message.hash()}/`) {
          return Response.json({
            safe: SAFE,
            messageHash: message.hash(),
            confirmations: Array.from({ length: message.confirmations }, () => ({
              signature: OWNER_SIGNATURE,
            })),
            preparedSignature: `0x${'ab'.repeat(65 * message.confirmations)}`,
          });
        }
        return Response.json({ detail: 'Not found.' }, { status: 404 });
      };
    }

    async function issuedForSafe(service: ReturnType<typeof mockService>) {
      const { nonce, issuedAt } = await service.issueNonce(SAFE, 'opt-out');
      return {
        nonce,
        typedData: buildOptOutTypedData({ address: SAFE, action: 'opt-out', nonce, issuedAt }),
      };
    }

    it('reports a message still below the threshold as awaiting co-signers', async () => {
      let hash: Hex = '0x';
      const service = serviceWith({
        safeFetch: safeServiceWith({ hash: () => hash, confirmations: 1 }),
        verifySignature: async () => false,
      });
      const { nonce, typedData } = await issuedForSafe(service);
      hash = safeMessageHashOf(typedData);

      expect(await service.findSafeSignature(nonce)).toEqual({
        ok: true,
        status: 'awaiting',
        confirmations: 1,
        threshold: 2,
      });
    });

    it('submits the combined signature once the owners reach the threshold', async () => {
      let hash: Hex = '0x';
      const combined = `0x${'ab'.repeat(130)}`;
      const service = serviceWith({
        safeFetch: safeServiceWith({ hash: () => hash, confirmations: 2 }),
        verifySignature: async ({ signature }) => signature === combined,
      });
      const { nonce, typedData } = await issuedForSafe(service);
      hash = safeMessageHashOf(typedData);

      const found = await service.findSafeSignature(nonce);
      expect(found).toEqual({
        ok: true,
        status: 'signed',
        submission: { typedData, signature: combined },
      });
      if (!found.ok || found.status !== 'signed') {
        return;
      }
      expect(await service.submitOptOut(found.submission)).toEqual({
        ok: true,
        receipt: { address: SAFE, action: 'opt-out', status: 'pending' },
      });
      expect(await service.findSafeSignature(nonce)).toMatchObject({
        ok: false,
        error: { code: 'nonce_used' },
      });
    });

    it('submits an empty signature once the Safe signed the message on-chain', async () => {
      const service = serviceWith({
        safeFetch: safeServiceWith(),
        // Stands in for isValidSignature(hash, 0x) after SignMessageLib ran.
        verifySignature: async ({ signature }) => signature === '0x',
      });
      const { nonce, typedData } = await issuedForSafe(service);

      const found = await service.findSafeSignature(nonce);
      expect(found).toEqual({
        ok: true,
        status: 'signed',
        submission: { typedData, signature: '0x' },
      });
      if (!found.ok || found.status !== 'signed') {
        return;
      }
      expect((await service.submitOptOut(found.submission)).ok).toBe(true);
    });

    it('in live mode, refuses an on-chain signature the Score API cannot accept yet, keeping the nonce', async () => {
      const service = serviceWith({
        scoreApi: createScoreApiClient({
          baseUrl: 'http://score.test',
          fetch: async () => Response.json({ error: { code: 'invalid_request' } }, { status: 400 }),
        }),
        safeFetch: safeServiceWith(),
        verifySignature: async ({ signature }) => signature === '0x',
      });
      const { nonce } = await issuedForSafe(service);

      const expected = { ok: false, error: { code: 'onchain_signature_unsupported' } };
      expect(await service.findSafeSignature(nonce)).toMatchObject(expected);
      expect(await service.findSafeSignature(nonce)).toMatchObject(expected);
    });

    it('refuses to resume an expired request', async () => {
      const service = serviceWith({ safeFetch: safeServiceWith() });
      const { nonce } = await issuedForSafe(service);

      clock = new Date('2026-09-26T12:00:00.001Z');

      expect(await service.findSafeSignature(nonce)).toMatchObject({
        ok: false,
        error: { code: 'nonce_expired' },
      });
    });

    it("lists a Safe's unused request so its owner can resume it, but not an EOA's", async () => {
      const service = serviceWith({ safeFetch: safeServiceWith() });
      const { nonce, typedData } = await issuedForSafe(service);
      await service.issueNonce(ALICE.address, 'opt-out');

      expect(await service.findSafeRequests([SAFE, ALICE.address])).toEqual({
        [SAFE.toLowerCase()]: {
          action: 'opt-out',
          nonce,
          issuedAt: typedData.message.issuedAt,
          expiresAt: '2026-09-26T12:00:00.000Z',
        },
        [ALICE.address.toLowerCase()]: null,
      });
    });

    it('hides an abandoned request once a newer one for the Safe went through', async () => {
      const service = serviceWith({
        safeFetch: safeServiceWith(),
        verifySignature: async ({ signature }) => signature === '0x',
      });
      await issuedForSafe(service);
      clock = new Date('2026-09-25T13:00:00.000Z');
      const newer = await issuedForSafe(service);
      await service.submitOptOut({ typedData: newer.typedData, signature: '0x' });

      expect(await service.findSafeRequests([SAFE])).toEqual({ [SAFE.toLowerCase()]: null });
    });
  });
});
