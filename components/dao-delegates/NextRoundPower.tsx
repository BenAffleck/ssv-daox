import { formatAmount, formatPower } from '@/lib/delegation/logic/auto-delegation';
import type { PowerChange } from '@/lib/delegation/logic/power-change';

/** The change the next score run makes to the DAO's delegation, set beside the current amount. */
export default function NextRoundPower({ change }: { change: PowerChange }) {
  const up = change.direction === 'up';
  const outcome = change.next === 0 ? 'ends' : `${formatPower(change.next)}`;
  return (
    <span
      className={`ml-1 text-xs whitespace-nowrap ${up ? 'text-accent' : 'text-warning'}`}
      title={`Next round: ${outcome === 'ends' ? 'delegation ends' : outcome}`}
    >
      <span className="sr-only">Next round: {up ? 'up' : 'down'} </span>
      <span aria-hidden="true">
        ({up ? '↑' : '↓'} {formatAmount(change.delta)})
      </span>
    </span>
  );
}
