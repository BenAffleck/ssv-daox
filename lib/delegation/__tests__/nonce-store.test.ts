import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createFileNonceStore,
  createMemoryNonceStore,
  NonceStoreFullError,
  type NonceStore,
  type NonceStoreOptions,
} from '../opt-out/nonce-store';

const ALICE = '0xa11ce00000000000000000000000000000000001';
const BOB = '0xb0b0000000000000000000000000000000000002';

const authentic = async () => true;

describe.each([
  [
    'file',
    (dir: string, options: NonceStoreOptions) =>
      createFileNonceStore(path.join(dir, 'n.json'), options),
  ],
  ['memory', (_dir: string, options: NonceStoreOptions) => createMemoryNonceStore(options)],
])('%s nonce store', (_name, create) => {
  let dir: string;
  let clock: Date;
  let store: NonceStore;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'nonce-store-'));
    clock = new Date('2026-09-25T12:00:00.000Z');
    store = create(dir, { now: () => clock, maxRecords: 3 });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('redeems an issued nonce once', async () => {
    const { nonce, issuedAt } = await store.issue(ALICE, 'opt-out');
    const message = { address: ALICE, action: 'opt-out', nonce, issuedAt } as const;

    expect(await store.redeem(message, authentic)).toEqual({ ok: true });
    expect(await store.redeem(message, authentic)).toEqual({ ok: false, reason: 'nonce_used' });
  });

  it('keeps the nonce when the signature is forged, so the owner can still use it', async () => {
    const { nonce, issuedAt } = await store.issue(ALICE, 'opt-out');
    const message = { address: ALICE, action: 'opt-out', nonce, issuedAt } as const;

    expect(await store.redeem(message, async () => false)).toEqual({
      ok: false,
      reason: 'invalid_signature',
    });
    expect(await store.redeem(message, authentic)).toEqual({ ok: true });
  });

  it('refuses a message that differs from what was issued, before checking the signature', async () => {
    const { nonce, issuedAt } = await store.issue(ALICE, 'opt-out');
    const issued = { address: ALICE, action: 'opt-out', nonce, issuedAt } as const;
    const neverAsked = async () => {
      throw new Error('the signature must not be checked');
    };

    expect(await store.redeem({ ...issued, nonce: 'f00' }, neverAsked)).toEqual({
      ok: false,
      reason: 'unknown_nonce',
    });
    expect(await store.redeem({ ...issued, address: BOB }, neverAsked)).toEqual({
      ok: false,
      reason: 'nonce_address_mismatch',
    });
    expect(await store.redeem({ ...issued, action: 'opt-in' }, neverAsked)).toEqual({
      ok: false,
      reason: 'nonce_mismatch',
    });
    expect(
      await store.redeem({ ...issued, issuedAt: '2030-01-01T00:00:00.000Z' }, neverAsked),
    ).toEqual({ ok: false, reason: 'nonce_mismatch' });
  });

  it('matches the issued address in any letter case', async () => {
    const { nonce, issuedAt } = await store.issue(
      ALICE.toUpperCase().replace('0X', '0x'),
      'opt-in',
    );

    expect(
      await store.redeem({ address: ALICE, action: 'opt-in', nonce, issuedAt }, authentic),
    ).toEqual({ ok: true });
  });

  it('stays usable for exactly a day', async () => {
    const first = await store.issue(ALICE, 'opt-out');
    const second = await store.issue(BOB, 'opt-out');

    clock = new Date('2026-09-26T12:00:00.000Z');
    expect(await store.open(first.nonce)).toMatchObject({ ok: true });
    expect(await store.redeem({ address: ALICE, action: 'opt-out', ...first }, authentic)).toEqual({
      ok: true,
    });

    clock = new Date('2026-09-26T12:00:00.001Z');
    expect(await store.open(second.nonce)).toEqual({ ok: false, reason: 'nonce_expired' });
    expect(await store.redeem({ address: BOB, action: 'opt-out', ...second }, authentic)).toEqual({
      ok: false,
      reason: 'nonce_expired',
    });
  });

  it('opens an issued nonce until it is redeemed', async () => {
    const { nonce, issuedAt } = await store.issue(ALICE, 'opt-out');

    expect(await store.open(nonce)).toEqual({
      ok: true,
      record: {
        nonce,
        address: ALICE,
        action: 'opt-out',
        issuedAt,
        expiresAt: '2026-09-26T12:00:00.000Z',
        used: false,
      },
    });
    await store.redeem({ address: ALICE, action: 'opt-out', nonce, issuedAt }, authentic);
    expect(await store.open(nonce)).toEqual({ ok: false, reason: 'nonce_used' });
    expect(await store.open('f00')).toEqual({ ok: false, reason: 'unknown_nonce' });
  });

  it('lets only one of two concurrent redemptions win', async () => {
    const { nonce, issuedAt } = await store.issue(ALICE, 'opt-out');
    const message = { address: ALICE, action: 'opt-out', nonce, issuedAt } as const;

    const results = await Promise.all([
      store.redeem(message, authentic),
      store.redeem(message, authentic),
    ]);

    expect(results).toContainEqual({ ok: true });
    expect(results).toContainEqual({ ok: false, reason: 'nonce_used' });
  });

  it("finds an address's latest request only while it is unused", async () => {
    await store.issue(ALICE, 'opt-out');
    clock = new Date('2026-09-25T13:00:00.000Z');
    const latest = await store.issue(ALICE, 'opt-in');

    expect(await store.latestUnused(ALICE.toUpperCase().replace('0X', '0x'))).toMatchObject({
      nonce: latest.nonce,
      action: 'opt-in',
    });
    expect(await store.latestUnused(BOB)).toBeNull();

    await store.redeem({ address: ALICE, action: 'opt-in', ...latest }, authentic);
    expect(await store.latestUnused(ALICE)).toBeNull();
  });

  it('refuses new nonces once full, until old records age out a day after expiry', async () => {
    for (let i = 0; i < 3; i++) {
      await store.issue(ALICE, 'opt-out');
    }
    await expect(store.issue(BOB, 'opt-out')).rejects.toBeInstanceOf(NonceStoreFullError);

    clock = new Date('2026-09-27T12:00:00.001Z');
    const issued = await store.issue(BOB, 'opt-out');
    expect(await store.open(issued.nonce)).toMatchObject({ ok: true });
  });
});
