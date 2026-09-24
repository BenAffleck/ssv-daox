interface DelegationStatusBadgeProps {
  isAlreadyDelegated: boolean;
  hasCohort: boolean;
}

export default function DelegationStatusBadge({
  isAlreadyDelegated,
  hasCohort,
}: DelegationStatusBadgeProps) {
  if (isAlreadyDelegated) {
    return hasCohort ? (
      <span className="badge badge-accent">Active</span>
    ) : (
      <span className="badge badge-danger">Remove</span>
    );
  }

  if (hasCohort) {
    return <span className="badge badge-primary">Add</span>;
  }

  return null;
}
