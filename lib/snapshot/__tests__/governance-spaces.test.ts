import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getGovernanceSpaces } from '../config';

const ENV_KEYS = [
  'SNAPSHOT_DELEGATION_SPACE_FILTER',
  'SNAPSHOT_LEADS_SPACE_ID',
  'SNAPSHOT_OPERATOR_SPACE_ID',
  'SNAPSHOT_GRANTS_SPACE_ID',
  'SNAPSHOT_MULTISIG_SPACE_ID',
] as const;

describe('getGovernanceSpaces', () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    ENV_KEYS.forEach((k) => {
      original[k] = process.env[k];
      delete process.env[k];
    });
  });

  afterEach(() => {
    ENV_KEYS.forEach((k) => {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    });
  });

  it('returns all five spaces when all env vars are set', () => {
    process.env.SNAPSHOT_DELEGATION_SPACE_FILTER = 'mainnet.ssvnetwork.eth';
    process.env.SNAPSHOT_LEADS_SPACE_ID = 'leads.ssvnetwork.eth';
    process.env.SNAPSHOT_OPERATOR_SPACE_ID = 'vo.ssvnetwork.eth';
    process.env.SNAPSHOT_GRANTS_SPACE_ID = 'grants.ssvnetwork.eth';
    process.env.SNAPSHOT_MULTISIG_SPACE_ID = 'msig.ssvnetwork.eth';

    const spaces = getGovernanceSpaces();
    expect(spaces.map((s) => s.key)).toEqual([
      'main',
      'leads',
      'operator',
      'grants',
      'multisig',
    ]);
    expect(spaces.find((s) => s.key === 'main')?.voteType).toBe('token');
    expect(spaces.find((s) => s.key === 'operator')?.voteType).toBe('member');
  });

  it('filters out spaces whose id is not configured', () => {
    process.env.SNAPSHOT_DELEGATION_SPACE_FILTER = 'mainnet.ssvnetwork.eth';
    process.env.SNAPSHOT_OPERATOR_SPACE_ID = 'vo.ssvnetwork.eth';
    // leads, grants, multisig left unset

    const spaces = getGovernanceSpaces();
    expect(spaces.map((s) => s.key)).toEqual(['main', 'operator']);
  });

  it('returns an empty list when nothing is configured', () => {
    expect(getGovernanceSpaces()).toEqual([]);
  });
});
