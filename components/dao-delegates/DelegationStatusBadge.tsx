interface DelegationStatusBadgeProps {
  isAlreadyDelegated: boolean;
}

export default function DelegationStatusBadge({
  isAlreadyDelegated,
}: DelegationStatusBadgeProps) {
  if (!isAlreadyDelegated) {
    return null;
  }

  return (
    <span className="badge badge-accent">
      Already Delegated
    </span>
  );
}
