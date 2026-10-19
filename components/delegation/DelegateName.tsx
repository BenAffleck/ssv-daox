import { AUTO_DELEGATION_POOL_NAME, isAutoDelegationPool } from '@/lib/delegation/logic/pool';

/** A delegate's address; the DAO auto-delegation pool's carries its name. `className` sets size and wrapping. */
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
      <span className={className}>
        <code className="font-mono text-foreground">{address}</code>{' '}
        <span className="text-muted">({AUTO_DELEGATION_POOL_NAME})</span>
      </span>
    );
  }
  return <code className={`font-mono text-foreground ${className}`}>{address}</code>;
}
