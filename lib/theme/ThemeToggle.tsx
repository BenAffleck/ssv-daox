'use client';

import { useTheme } from './useTheme';
import { Theme } from './types';

export default function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme();

  const themeLabels: Record<Theme, string> = {
    ssvdark: 'SSV Dark',
    ssvlight: 'SSV Light',
  };

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className="rounded-md border border-border bg-card px-3 py-1.5 font-heading text-sm text-foreground transition-colors hover:bg-card-hover"
      aria-label="Select theme"
    >
      {themes.map((t) => (
        <option key={t} value={t}>
          {themeLabels[t]}
        </option>
      ))}
    </select>
  );
}
