interface AISourceBadgeProps {
  /** Confidence level of the AI extraction */
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Badge for AI-extracted events
 * Uses secondary color scheme (purple/violet in SSV brand)
 */
export default function AISourceBadge({ confidence }: AISourceBadgeProps) {
  const confidenceOpacity =
    confidence === 'high'
      ? ''
      : confidence === 'medium'
        ? 'opacity-90'
        : 'opacity-75';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2 py-0.5 text-xs font-medium text-secondary ${confidenceOpacity}`}
      title={confidence ? `Confidence: ${confidence}` : undefined}
    >
      <span className="text-xs leading-none">✨</span>
      AI Insights
    </span>
  );
}
