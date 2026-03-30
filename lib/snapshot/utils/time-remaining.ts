/**
 * Formats a future timestamp into a human-readable "time remaining" string
 *
 * @param endTimestamp - Unix timestamp in seconds
 * @returns Formatted string like "2d 5h left", "12h left", "< 1h left", or "Ended"
 */
export function formatTimeRemaining(endTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTimestamp - now;

  if (remaining <= 0) {
    return 'Ended';
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h left`;
  }

  return '< 1h left';
}

/**
 * Formats a future start timestamp into a human-readable "time until start" string
 *
 * @param startTimestamp - Unix timestamp in seconds
 * @returns Formatted string like "Starts in 2d 5h", "Starts in 12h", "Starts in < 1h", or "Starting soon"
 */
export function formatTimeUntilStart(startTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = startTimestamp - now;

  if (remaining <= 0) {
    return 'Starting soon';
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);

  if (days > 0) {
    return `Starts in ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Starts in ${hours}h`;
  }

  return 'Starts in < 1h';
}
