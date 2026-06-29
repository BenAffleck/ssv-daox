import type { GovernanceSpace } from '@/lib/snapshot/types';
import { getSpaceStyle } from '@/lib/dao-governance/space-style';

interface SpaceBadgeProps {
  space: GovernanceSpace;
}

/**
 * Small badge identifying which Snapshot space a proposal belongs to
 * (DAO / Leads / Operators / Grants / Multisig). Color matches the card's
 * accent stripe and the space's filter chip.
 */
export default function SpaceBadge({ space }: SpaceBadgeProps) {
  const { badgeClass } = getSpaceStyle(space.key);
  const title =
    space.voteType === 'token'
      ? `${space.label} — token-weighted vote`
      : `${space.label} — committee member vote`;

  return (
    <span className={`shrink-0 ${badgeClass}`} title={title}>
      {space.label}
    </span>
  );
}
