import { getSpaceStyle } from '@/lib/dao-governance/space-style';
import type { GovernanceSpace } from '@/lib/snapshot/types';

interface SpaceBadgeProps {
  space: GovernanceSpace;
}

/**
 * Quiet label identifying which Snapshot space a proposal belongs to
 * (DAO / Leads / Operators / Grants / Multisig). The dot matches the space's
 * filter chip; colour stays on the dot so status badges keep the emphasis.
 */
export default function SpaceBadge({ space }: SpaceBadgeProps) {
  const { dotClass } = getSpaceStyle(space.key);
  const title =
    space.voteType === 'token'
      ? `${space.label} — token-weighted vote`
      : `${space.label} — committee member vote`;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 font-medium text-foreground/80"
      title={title}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
      {space.label}
    </span>
  );
}
