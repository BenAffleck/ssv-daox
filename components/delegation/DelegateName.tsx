import { AUTO_DELEGATION_POOL_NAME, isAutoDelegationPool } from '@/lib/delegation/logic/pool';

/** The pool by name, any other delegate by address. `className` sets size and wrapping. */
export default function DelegateName({
  address,
  className,
  isPool = isAutoDelegationPool(address),
}: {
  address: string;
  className: string;
  isPool?: boolean;
}) {
  if (isPool) {
    return (
      <span title={address} className={`text-foreground ${className}`}>
        {AUTO_DELEGATION_POOL_NAME}
      </span>
    );
  }
  return <code className={`font-mono text-foreground ${className}`}>{address}</code>;
}
