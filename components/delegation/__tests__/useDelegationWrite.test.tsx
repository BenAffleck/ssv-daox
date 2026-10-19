// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDelegationWrite } from '../DelegationTransaction';

const HASH = `0x${'ab'.repeat(32)}`;
const writeContractAsync = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x667C1b7dde10A6fC7040a244218231a63Ed969D2' }),
  usePublicClient: () => ({ getCode: async () => '0x' }),
  useWriteContract: () => ({ writeContractAsync, isPending: false }),
  useWaitForTransactionReceipt: () => ({}),
}));

const KEY = 'test:delegation';

describe('useDelegationWrite with a storage key', () => {
  beforeEach(() => {
    localStorage.clear();
    writeContractAsync.mockReset().mockResolvedValue(HASH);
  });

  it('shows a sent write again after a reload', async () => {
    const first = renderHook(() => useDelegationWrite(KEY));
    await act(() => first.result.current.send('clear'));
    first.unmount();

    const reloaded = renderHook(() => useDelegationWrite(KEY));
    await waitFor(() =>
      expect(reloaded.result.current.submission).toMatchObject({ kind: 'sent', hash: HASH }),
    );
  });

  it('forgets a write once it is reset', async () => {
    const first = renderHook(() => useDelegationWrite(KEY));
    await act(() => first.result.current.send('clear'));
    act(() => first.result.current.resetSubmission());
    first.unmount();

    const reloaded = renderHook(() => useDelegationWrite(KEY));
    expect(reloaded.result.current.submission).toBeNull();
  });

  it('forgets a write older than an hour', async () => {
    const first = renderHook(() => useDelegationWrite(KEY));
    await act(() => first.result.current.send('clear'));
    first.unmount();
    const stored = JSON.parse(localStorage.getItem(KEY)!);
    localStorage.setItem(KEY, JSON.stringify({ ...stored, sentAt: Date.now() - 61 * 60 * 1000 }));

    const reloaded = renderHook(() => useDelegationWrite(KEY));
    expect(reloaded.result.current.submission).toBeNull();
  });
});
