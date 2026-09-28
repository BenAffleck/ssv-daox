import {
  AUTO_DELEGATION_POOL_NAME,
  isAutoDelegationPool,
} from '@/lib/delegation/logic/auto-delegation';

/** The pool by name, any other delegate by address. `className` sets size and wrapping. */
export default function DelegateName({
  address,
  className,
}: {
  address: string;
  className: string;
}) {
  if (isAutoDelegationPool(address)) {
    return (
      <span title={address} className={`text-foreground ${className}`}>
        {AUTO_DELEGATION_POOL_NAME}
      </span>
    );
  }
  return <code className={`font-mono text-foreground ${className}`}>{address}</code>;
}
