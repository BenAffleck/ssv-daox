import { formatVotingPower, getQuorumStatus } from '@/lib/dao-governance/quorum';
import { buildDisplayChoices } from '@/lib/dao-governance/vote-choices';
import type { SnapshotActiveProposal } from '@/lib/snapshot/types';

interface VoteResultsProps {
  proposal: Pick<SnapshotActiveProposal, 'choices' | 'scores' | 'scores_total' | 'quorum'>;
}

/**
 * Stacked result bar with a per-choice legend. Short of quorum, the bar spans
 * the quorum and the unfilled remainder is tinted as the shortfall; once quorum
 * is met it is a plain 100% split.
 */
export default function VoteResults({ proposal }: VoteResultsProps) {
  const quorum = getQuorumStatus(proposal);
  if (proposal.scores_total <= 0 && !quorum) return null;

  const choices = buildDisplayChoices(proposal);
  const shortfall = quorum && !quorum.reached ? quorum.required - quorum.cast : 0;
  const track = proposal.scores_total + shortfall;
  const share = (score: number) =>
    proposal.scores_total > 0 ? (score / proposal.scores_total) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted/15">
        {choices.map((choice) => {
          if (choice.score === 0) return null;
          return (
            <div
              key={choice.label}
              className={`${choice.color} min-w-1 transition-all`}
              style={{ width: `${(choice.score / track) * 100}%` }}
              title={`${choice.label}: ${share(choice.score).toFixed(1)}%`}
            />
          );
        })}
        {shortfall > 0 && (
          <div
            className="flex-1 bg-warning/20"
            title={`${formatVotingPower(shortfall)} short of quorum`}
          />
        )}
      </div>
      {proposal.scores_total > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
          {choices
            .filter((choice) => choice.score > 0)
            .map((choice) => (
              <li key={choice.label} className="flex items-center gap-1.5 text-[12px]">
                <span className={`inline-block h-2 w-2 rounded-full ${choice.color}`} />
                <span className="text-muted">{choice.label}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {share(choice.score).toFixed(1)}%
                </span>
                <span className="text-muted tabular-nums">{formatVotingPower(choice.score)}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
