import React from 'react';
import { Delegate } from '@/lib/dao-delegates/types';

interface EligibilityBadgeProps {
  delegate: Delegate;
}

export default function EligibilityBadge({ delegate }: EligibilityBadgeProps) {
  const badges: React.ReactElement[] = [];

  // Fixed list members get guaranteed delegation badge
  if (delegate.isOnFixedList) {
    delegate.fixedListNames.forEach((name) => {
      badges.push(
        <span key={name} className="badge badge-secondary">
          {name} (seated)
        </span>
      );
    });
  }

  // If eligible for competitive seats
  if (delegate.isEligible && !delegate.isOnFixedList) {
    badges.push(
      <span
        key="eligible"
        className="badge badge-accent"
      >
        Eligible
      </span>
    );
  }

  // Show ineligibility reasons (VIP, Committee)
  if (!delegate.isEligible) {
    if (delegate.isVIP) {
      badges.push(
        <span
          key="vip"
          className="badge badge-primary"
        >
          VIP
        </span>
      );
    }

    if (delegate.isOnCommittee) {
      delegate.committeeNames.forEach((name) => {
        badges.push(
          <span
            key={name}
            className="badge badge-secondary"
          >
            {name}
          </span>
        );
      });
    }
  }

  if (badges.length === 0) {
    return null;
  }

  return <div className="flex flex-wrap gap-1">{badges}</div>;
}
