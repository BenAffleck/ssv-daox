import { Delegate } from '../types';
import { getDelegationPrograms } from '../config';

/**
 * Assigns delegates to delegation programs based on rank and eligibility
 * Two-phase assignment:
 * 1. Fixed list delegates get automatic assignment (doesn't count against seats)
 * 2. Eligible delegates compete for available seats in rank order
 */
export function assignDelegationPrograms(delegates: Delegate[]): Delegate[] {
  const programs = getDelegationPrograms();
  const assignments: Record<string, number> = {};

  // Initialize competitive seat counters
  programs.forEach((p) => {
    assignments[p.id] = 0;
  });

  return delegates.map((delegate) => {
    const assignedPrograms: string[] = [];

    // Skip withdrawn delegates - they don't get assignments and don't consume seats
    if (delegate.status.toLowerCase() === 'withdrawn') {
      return {
        ...delegate,
        delegationPrograms: [],
      };
    }

    // Phase 1: Fixed list delegates get automatic assignment to all programs
    // Fixed list delegates bypass profile completeness requirement
    if (delegate.isOnFixedList) {
      for (const program of programs) {
        assignedPrograms.push(program.displayName);
      }
    }
    // Phase 2: Eligible delegates compete for available seats
    // Must have complete profile (unless on fixed list, already handled above)
    else if (delegate.isEligible && delegate.isProfileComplete) {
      for (const program of programs) {
        // Check if program requires eligibility and has available competitive seats
        if (
          program.requiresEligibility &&
          assignments[program.id] < program.availableSeats
        ) {
          assignedPrograms.push(program.displayName);
          assignments[program.id]++;
        }
      }
    }

    return {
      ...delegate,
      delegationPrograms: assignedPrograms,
    };
  });
}
