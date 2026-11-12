/**
 * Date utilities for the Timeline module
 */

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Day-header label: "Today", "Tomorrow", else "Monday, January 15, 2024".
 * `today` is the same reference day the countdowns use.
 */
export function getDateLabel(date: Date, today: Date): string {
  return formatDayLabel(date, today, 'long');
}

/** `getDateLabel` abbreviated for narrow screens: "Mon, Jan 15, 2024". */
export function getShortDateLabel(date: Date, today: Date): string {
  return formatDayLabel(date, today, 'short');
}

function formatDayLabel(date: Date, today: Date, nameStyle: 'long' | 'short'): string {
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (isSameDay(date, today)) {
    return 'Today';
  }
  if (isSameDay(date, tomorrow)) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', {
    weekday: nameStyle,
    year: 'numeric',
    month: nameStyle,
    day: 'numeric',
  });
}

/**
 * Format a time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date range for display
 */
export function formatDateRange(startDate: Date, endDate: Date | null, isAllDay: boolean): string {
  if (isAllDay) {
    if (!endDate || isSameDay(startDate, endDate)) {
      return 'All day';
    }
    // Multi-day all-day event
    const startStr = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${startStr} - ${endStr}`;
  }

  const startTime = formatTime(startDate);
  if (!endDate) {
    return startTime;
  }

  if (isSameDay(startDate, endDate)) {
    return `${startTime} - ${formatTime(endDate)}`;
  }

  // Spans multiple days
  const startStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${startStr} - ${endStr}`;
}

/**
 * Get start of day for a date
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day for a date
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get the week day index (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Parse a date string in YYYY-MM-DD format
 */
export function parseYMD(str: string): Date {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
