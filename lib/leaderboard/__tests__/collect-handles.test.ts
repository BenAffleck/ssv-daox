import { describe, expect, it } from 'vitest';

import { collectHandles } from '../logic/collect-handles';
import type { Delegate } from '../types';

function delegate(forumHandle: string | null, discordHandle: string | null): Delegate {
  return { forumHandle, discordHandle } as Delegate;
}

describe('collectHandles', () => {
  it('lists a handle shared by one identity once', () => {
    const delegates = [delegate('eridian', 'eri#0'), delegate('eridian', 'eri#0')];

    expect(collectHandles(delegates, 'forumHandle')).toEqual(['eridian']);
    expect(collectHandles(delegates, 'discordHandle')).toEqual(['eri#0']);
  });

  it('skips missing and blank handles', () => {
    const delegates = [delegate(null, ' '), delegate('flo', null)];

    expect(collectHandles(delegates, 'forumHandle')).toEqual(['flo']);
    expect(collectHandles(delegates, 'discordHandle')).toEqual([]);
  });
});
