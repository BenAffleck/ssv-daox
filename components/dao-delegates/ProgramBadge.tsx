interface ProgramBadgeProps {
  programs: string[];
}

export default function ProgramBadge({ programs }: ProgramBadgeProps) {
  if (programs.length === 0) {
    return (
      <span className="text-xs text-muted">
        Not assigned
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {programs.map((program) => (
        <span
          key={program}
          className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {program}
        </span>
      ))}
    </div>
  );
}
