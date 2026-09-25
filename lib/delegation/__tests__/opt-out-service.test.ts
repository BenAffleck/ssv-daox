import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { verifyTypedData, type Address } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMockScoreApiClient } from '../opt-out/mock-score-api';
import { createScoreApiClient } from '../opt-out/score-api';
import {
  createOptOutService,
  type NonceRecord,
  type NonceStore,
  type OptOutServiceDeps,
  type SignatureVerifier,
} from '../opt-out/service';
import { buildOptOutTypedData, type OptOutAction } from '../opt-out/typed-data';

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
  }: Partial<Pick<OptOutServiceDeps, 'scoreApi' | 'verifySignature'>> = {}) {
    return createOptOutService({
      nonces: memoryNonceStore(),
      scoreApi,
      verifySignature,
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
    const { nonce, issuedAt } = await service.issueNonce(address);
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
    const { nonce, issuedAt } = await service.issueNonce(BOB.address);
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
    const { nonce } = await service.issueNonce(ALICE.address);
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
});
