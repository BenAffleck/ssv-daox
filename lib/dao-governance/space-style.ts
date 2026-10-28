/**
 * Per-space visual language for the Governance view.
 *
 * Each governance space gets one semantic dot colour, shared by the card's
 * space label and the filter chip, so a space is recognizable at a glance.
 * Uses existing semantic tokens only — no new colors (per the design system).
 */
export interface SpaceStyle {
  /** Dot background class for space labels and filter chips. */
  dotClass: string;
}

const STYLES: Record<string, SpaceStyle> = {
  main: { dotClass: 'bg-primary' },
  leads: { dotClass: 'bg-secondary' },
  operator: { dotClass: 'bg-accent' },
  grants: { dotClass: 'bg-warning' },
  multisig: { dotClass: 'bg-muted' },
};

const FALLBACK: SpaceStyle = { dotClass: 'bg-muted' };

export function getSpaceStyle(key: string): SpaceStyle {
  return STYLES[key] ?? FALLBACK;
}
