import { getSourceColorClass } from '@/lib/dao-timeline/config';

interface AISourceBadgeProps {
  /** Confidence level of the AI extraction */
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Sparkle icon SVG component
 */
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.233.616a1 1 0 01-.894 1.79l-1.6-.8L10 11.12l-3.954-1.582-1.599.8a1 1 0 01-.894-1.79l1.233-.616-1.233-.616a1 1 0 01.894-1.79l1.6.8L10 4.88V3a1 1 0 011-1zm0 4.618L6.046 8.2 10 9.783l3.954-1.582L10 6.618zM10 13a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Badge for AI-extracted events with sparkle icon
 * Uses violet/purple color scheme to distinguish from other sources
 */
export default function AISourceBadge({ confidence }: AISourceBadgeProps) {
  const colorClass = getSourceColorClass('ai-insights');

  // Subtle confidence indicator via opacity
  const confidenceOpacity =
    confidence === 'high'
      ? ''
      : confidence === 'medium'
        ? 'opacity-90'
        : 'opacity-75';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass} ${confidenceOpacity}`}
      title={confidence ? `Confidence: ${confidence}` : undefined}
    >
      <SparkleIcon className="h-3 w-3" />
      AI Insights
    </span>
  );
}
