import { Theme } from '@/lib/theme/types';

/**
 * Detects the user's system theme preference
 * @returns 'ssvdark' if system prefers dark mode, 'ssvlight' otherwise
 */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'ssvlight';
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'ssvdark' : 'ssvlight';
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
    if (saved === 'ssvdark' || saved === 'ssvlight') {
      return saved;
    }
    return null;
  } catch (error) {
    console.error('Failed to load theme preference:', error);
    return null;
  }
}
