import { Theme } from '@/lib/theme/types';

/**
 * Detects the user's system theme preference
 * @returns 'dark' if system prefers dark mode, 'light' otherwise
 */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Saves the user's theme preference to localStorage
 * @param theme - The theme to save
 */
export function saveThemePreference(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
}

/**
 * Loads the user's theme preference from localStorage
 * @returns The saved theme, or null if none exists
 */
export function loadThemePreference(): Theme | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'ssv-network') {
      return saved;
    }
    return null;
  } catch (error) {
    console.error('Failed to load theme preference:', error);
    return null;
  }
}
