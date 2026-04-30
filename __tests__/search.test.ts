import { describe, it, expect } from 'vitest';
import {
  buildSearchIndex,
  scoreSearchItem,
  searchItems,
} from '@/lib/search';
import {
  ExternalTool,
  ExternalToolCategory,
  Module,
  ModuleStatus,
} from '@/lib/types';

const modules: Module[] = [
  {
    id: 'dao-delegates',
    slug: 'delegates',
    name: 'DAO Delegates',
    description: 'Ranked leaderboard of active delegates with voting power.',
    status: ModuleStatus.ACTIVE,
    sortOrder: 1,
  },
  {
    id: 'governance-proposals',
    slug: 'governance-proposals',
    name: 'Governance Proposals',
    description: 'Browse and track governance proposals with voting status.',
    status: ModuleStatus.COMING_SOON,
    sortOrder: 2,
  },
];

const tools: ExternalTool[] = [
  {
    id: 'stakeeasy',
    name: 'Stake Easy',
    description: 'SSV cluster advisor — find the best operator clusters.',
    categories: [ExternalToolCategory.EXPLORER, ExternalToolCategory.SIMULATOR],
    inputs: 'ETH',
    outputs: 'Clusters',
    host: 'stakeeasy.xyz',
    url: 'https://stakeeasy.xyz',
    featured: true,
    sortOrder: 1,
  },
  {
    id: 'reward-calc',
    name: 'cSSV Reward Calculator',
    description: 'Estimate APR and ETH-fee rewards for cSSV staking.',
    categories: [ExternalToolCategory.CALCULATOR],
    inputs: 'Staked SSV',
    outputs: 'APR',
    host: 'ssv.network',
    url: 'https://ssv.network/cssv',
    sortOrder: 2,
  },
];

describe('buildSearchIndex', () => {
  it('produces an entry per module + tool', () => {
    const index = buildSearchIndex(modules, tools);
    expect(index).toHaveLength(modules.length + tools.length);
  });

  it('flags external tools with external=true and modules with external=false', () => {
    const index = buildSearchIndex(modules, tools);
    expect(index.find((i) => i.id === 'module:dao-delegates')?.external).toBe(false);
    expect(index.find((i) => i.id === 'tool:stakeeasy')?.external).toBe(true);
  });

  it('routes active modules to /<slug> and coming-soon modules to #', () => {
    const index = buildSearchIndex(modules, tools);
    expect(index.find((i) => i.id === 'module:dao-delegates')?.url).toBe('/delegates');
    expect(index.find((i) => i.id === 'module:governance-proposals')?.url).toBe('#');
  });

  it('preserves featured flag from external tools', () => {
    const index = buildSearchIndex(modules, tools);
    expect(index.find((i) => i.id === 'tool:stakeeasy')?.featured).toBe(true);
    expect(index.find((i) => i.id === 'tool:reward-calc')?.featured).toBeUndefined();
  });
});

describe('scoreSearchItem', () => {
  const index = buildSearchIndex(modules, tools);
  const stakeEasy = index.find((i) => i.id === 'tool:stakeeasy')!;

  it('returns 0 for an empty query', () => {
    expect(scoreSearchItem(stakeEasy, '')).toBe(0);
  });

  it('returns -1 when nothing matches', () => {
    expect(scoreSearchItem(stakeEasy, 'zzzzzzz')).toBe(-1);
  });

  it('scores name matches higher than description-only matches', () => {
    const nameMatch = scoreSearchItem(stakeEasy, 'stake');
    const descMatch = scoreSearchItem(stakeEasy, 'cluster');
    expect(nameMatch).toBeGreaterThan(descMatch);
  });

  it('matches across the host and description fields', () => {
    expect(scoreSearchItem(stakeEasy, 'stakeeasy.xyz')).toBeGreaterThan(0);
    expect(scoreSearchItem(stakeEasy, 'cluster advisor')).toBeGreaterThan(0);
  });
});

describe('searchItems', () => {
  const index = buildSearchIndex(modules, tools);

  it('returns the full index unfiltered for empty queries', () => {
    expect(searchItems(index, '').length).toBe(index.length);
    expect(searchItems(index, '   ').length).toBe(index.length);
  });

  it('filters out non-matching items', () => {
    const results = searchItems(index, 'delegate');
    expect(results.some((r) => r.item.name === 'DAO Delegates')).toBe(true);
    expect(results.some((r) => r.item.name === 'cSSV Reward Calculator')).toBe(false);
  });

  it('ranks name hits above description hits', () => {
    const results = searchItems(index, 'reward');
    expect(results[0]?.item.name).toBe('cSSV Reward Calculator');
  });

  it('matches tools by their category text', () => {
    const results = searchItems(index, 'simulator');
    expect(results.some((r) => r.item.name === 'Stake Easy')).toBe(true);
  });
});
