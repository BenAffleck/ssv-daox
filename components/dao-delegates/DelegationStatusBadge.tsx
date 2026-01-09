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
    <span className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
      Already Delegated
    </span>
  );
}
