import { CommunityTool } from '@/lib/types';

export const communityTools: CommunityTool[] = [
  {
    id: 'stakeeasy',
    name: 'Stake Easy',
    description: 'Simplified staking experience for SSV Network',
    url: 'https://stakeeasy.xyz',
    sortOrder: 1,
  },
  {
    id: 'governance-parameters',
    name: 'Governance Parameter Calculation',
    description: 'Calculate and explore SSV DAO governance parameters',
    url: 'https://ssv-params.vercel.app',
    sortOrder: 2,
  },
];

export function getCommunityToolsSorted(): CommunityTool[] {
  return [...communityTools].sort((a, b) => a.sortOrder - b.sortOrder);
}
