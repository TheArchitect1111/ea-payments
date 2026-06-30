import { eaPulseTheme } from '@ea/premium-chassis/theme';

/** Canonical EA Platform color + layout tokens for TS/inline styles. */
export const EA_THEME = eaPulseTheme;

export const NAVY = eaPulseTheme.colors.navy;
export const GOLD = eaPulseTheme.colors.gold;
export const CREAM = eaPulseTheme.colors.cream;

/** @deprecated Prefer EA_THEME.colors — kept for legacy imports */
export const EA_BRAND = { NAVY, GOLD, navy: NAVY, gold: GOLD } as const;

export const EA_CSS_VARS = {
  navy: 'var(--ea-navy)',
  gold: 'var(--ea-gold)',
  cream: 'var(--ea-cream)',
  surface: 'var(--ea-surface)',
  text: 'var(--ea-text)',
  muted: 'var(--ea-muted)',
} as const;
