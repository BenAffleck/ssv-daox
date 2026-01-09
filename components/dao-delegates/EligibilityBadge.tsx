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
        <span
          key={name}
          className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent"
        >
          {name} (Guaranteed)
        </span>
      );
    });
  }

  // If eligible for competitive seats
  if (delegate.isEligible && !delegate.isOnFixedList) {
    badges.push(
      <span
        key="eligible"
        className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent"
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
          className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary"
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
            className="inline-flex items-center rounded-full bg-secondary/20 px-2.5 py-0.5 text-xs font-medium text-secondary"
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
