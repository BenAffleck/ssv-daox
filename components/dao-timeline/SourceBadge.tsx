import { getSourceColorClass } from '@/lib/dao-timeline/config';

interface SourceBadgeProps {
  name: string;
  color?: string;
}

export default function SourceBadge({ name, color }: SourceBadgeProps) {
  const colorClass = getSourceColorClass(color);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {name}
    </span>
  );
}
