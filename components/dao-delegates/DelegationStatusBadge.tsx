interface DelegationStatusBadgeProps {
  isAlreadyDelegated: boolean;
  hasCohort: boolean;
}

/** Compares the delegate's cohort seat with the DAO's live delegation to it. */
export default function DelegationStatusBadge({
  isAlreadyDelegated,
  hasCohort,
}: DelegationStatusBadgeProps) {
  if (isAlreadyDelegated) {
    return hasCohort ? (
      <span className="badge badge-accent" title="Holds a cohort seat and the DAO's delegation.">
        Active
      </span>
    ) : (
      <span
        className="badge badge-muted"
        title="No cohort seat this run. The DAO's delegation ends at the next update."
      >
        Ending
      </span>
    );
  }

  if (hasCohort) {
    return (
      <span
        className="badge badge-warning"
        title="Earned a cohort seat. The DAO's delegation starts at the next update."
      >
        Nominated
      </span>
    );
  }

  return null;
}
