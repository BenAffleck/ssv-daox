import { ExternalTool, ExternalToolCategory } from '@/lib/types';

export const externalTools: ExternalTool[] = [
  {
    id: 'stakeeasy',
    name: 'Stake Easy',
    description: 'SSV cluster advisor — explore operator clusters and find the best match for staking your ETH.',
    categories: [ExternalToolCategory.EXPLORER, ExternalToolCategory.SIMULATOR],
    inputs: 'ETH amount · Preferences',
    outputs: 'Cluster recommendations',
    host: 'stakeeasy.xyz',
    url: 'https://stakeeasy.xyz',
    featured: true,
    sortOrder: 1,
  },
  {
    id: 'cssv-reward-calculator',
    name: 'cSSV Reward Calculator',
    description: 'Mint cSSV by staking SSV — estimate APR and ETH-fee rewards from running the validator infra.',
    categories: [ExternalToolCategory.CALCULATOR],
    inputs: 'ETH APR · Prices · Staked SSV',
    outputs: 'SSV APR · Annual fees',
    host: 'ssv.network',
    url: 'https://ssv.network/cssv',
    sortOrder: 2,
  },
  {
    id: 'incentivized-mainnet-rewards',
    name: 'Incentivized Mainnet Rewards',
    description: 'Estimate yearly SSV rewards based on staked ETH and the current Incentivized Mainnet tier boost.',
    categories: [ExternalToolCategory.CALCULATOR],
    inputs: 'Staked ETH · Tier',
    outputs: 'SSV/yr · USD · Tier APY',
    host: 'ssv.network',
    url: 'https://ssv.network/incentivized-mainnet',
    sortOrder: 3,
  },
  {
    id: 'governance-parameter-calculator',
    name: 'Governance Parameter Calculator',
    description: 'Explore and tune SSV DAO governance parameters to see how proposed values affect protocol behaviour.',
    categories: [ExternalToolCategory.SIMULATOR],
    inputs: 'Parameter values',
    outputs: 'Resulting config',
    host: 'ssv-params.vercel.app',
    url: 'https://ssv-params.vercel.app',
    sortOrder: 4,
  },
  {
    id: 'ssv-staking-dashboard',
    name: 'SSV Staking Dashboard',
    description: 'Cluster migration, operator performance, cSSV yields, and fee-market metrics across SSV Network.',
    categories: [ExternalToolCategory.DASHBOARD],
    inputs: 'Live on-chain feed',
    outputs: 'Migration · APR · Fees',
    host: 'yutingzhang.workers.dev',
    url: 'https://ssv-dashboard.yutingzhang.workers.dev',
    sortOrder: 5,
  },
  {
    id: 'monitorssv-liquidations',
    name: 'MonitorSSV Liquidations',
    description: 'Real-time view of SSV operator clusters at risk of liquidation due to insufficient SSV balance.',
    categories: [ExternalToolCategory.SIMULATOR],
    inputs: 'Live on-chain feed',
    outputs: 'At-risk clusters · Runway',
    host: 'monitorssv.xyz',
    url: 'https://monitorssv.xyz/liquidation',
    sortOrder: 6,
  },
  {
    id: 'dune-ssv-overview',
    name: 'SSV Network Overview',
    description: 'Protocol-wide on-chain analytics: validators, clusters, operators, and network growth on Dune.',
    categories: [ExternalToolCategory.DASHBOARD],
    inputs: 'Live on-chain feed',
    outputs: 'Validators · Clusters · Growth',
    host: 'dune.com',
    url: 'https://dune.com/ssv_network/ssv',
    sortOrder: 7,
  },
  {
    id: 'dune-ssv-imp',
    name: 'Incentivized Mainnet Stats',
    description: 'Track participation, distributed rewards, and tier progression across the Incentivized Mainnet program.',
    categories: [ExternalToolCategory.DASHBOARD],
    inputs: 'Live on-chain feed',
    outputs: 'Rewards · Tiers · Participation',
    host: 'dune.com',
    url: 'https://dune.com/ssv_network/ssv-imp',
    sortOrder: 8,
  },
  {
    id: 'dune-ssv-token',
    name: 'SSV Token Analytics',
    description: 'Token supply, holder distribution, transfers, and DEX activity for the SSV ERC-20 token.',
    categories: [ExternalToolCategory.DASHBOARD],
    inputs: 'Live on-chain feed',
    outputs: 'Supply · Holders · Volume',
    host: 'dune.com',
    url: 'https://dune.com/ssv_network/ssvnetworktoken',
    sortOrder: 9,
  },
  {
    id: 'ssv-eth-accrual-token',
    name: 'SSV - ETH Accrual Token',
    description: 'Calculator modelling how SSV could become an ETH-accruing token — see how network activity compounds into ETH yield for stakers (pending DAO approval).',
    categories: [ExternalToolCategory.CALCULATOR, ExternalToolCategory.SIMULATOR],
    inputs: 'SSV holdings · Network assumptions',
    outputs: 'Projected ETH yield · APR',
    host: 'ethaccrualtoken.com',
    url: 'https://ethaccrualtoken.com',
    featured: true,
    sortOrder: 10,
  },
];

/**
 * Sort featured tools first (pinned to top), then by sortOrder ascending within each group.
 */
export function getExternalToolsSorted(): ExternalTool[] {
  return [...externalTools].sort((a, b) => {
    const aFeat = a.featured ? 1 : 0;
    const bFeat = b.featured ? 1 : 0;
    if (aFeat !== bFeat) return bFeat - aFeat;
    return a.sortOrder - b.sortOrder;
  });
}
