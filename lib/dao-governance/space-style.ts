/**
 * Per-space visual language for the Governance Votes view.
 *
 * Each governance space gets one semantic color used consistently across three
 * places so a space is instantly recognizable: the card badge, the card's
 * left-accent stripe, and the filter chip's color dot. Uses existing semantic
 * tokens only — no new colors (per the design system).
 */
export interface SpaceStyle {
  /** Small badge class for the card header. */
  badgeClass: string;
  /** Left-border accent class for the card stripe (pair with `border-l-4`). */
  accentClass: string;
  /** Dot background class for filter chips / legends. */
  dotClass: string;
}

const STYLES: Record<string, SpaceStyle> = {
  main: { badgeClass: 'badge-sm-primary', accentClass: 'border-l-primary', dotClass: 'bg-primary' },
  leads: { badgeClass: 'badge-sm-secondary', accentClass: 'border-l-secondary', dotClass: 'bg-secondary' },
  operator: { badgeClass: 'badge-sm-accent', accentClass: 'border-l-accent', dotClass: 'bg-accent' },
  grants: { badgeClass: 'badge-sm-warning', accentClass: 'border-l-warning', dotClass: 'bg-warning' },
  multisig: { badgeClass: 'badge-sm-muted', accentClass: 'border-l-muted', dotClass: 'bg-muted' },
};

const FALLBACK: SpaceStyle = {
  badgeClass: 'badge-sm-muted',
  accentClass: 'border-l-muted',
  dotClass: 'bg-muted',
};

export function getSpaceStyle(key: string): SpaceStyle {
  return STYLES[key] ?? FALLBACK;
}
