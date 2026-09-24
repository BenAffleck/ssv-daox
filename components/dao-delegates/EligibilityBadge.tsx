import { Delegate } from '@/lib/dao-delegates/types';

interface EligibilityBadgeProps {
  delegate: Delegate;
}

export default function EligibilityBadge({ delegate }: EligibilityBadgeProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {delegate.isOnCommittee ? (
        delegate.committeeNames.map((name) => (
          <span key={name} className="badge badge-secondary">
            {name}
          </span>
        ))
      ) : (
        <span className="badge badge-accent">Eligible</span>
      )}
    </div>
  );
}
