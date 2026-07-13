export type ThemeAppearance = 'light' | 'dark';
export type ThemeDensity = 'compact' | 'comfortable' | 'spacious';

/** Brand / workspace theme contract for multi-tenant shells. */
export type WorkspaceTheme = {
  id: string;
  organizationId: string;
  name: string;
  logo?: string;
  logoAlt?: string;
  favicon?: string;
  heroImage?: string;
  backgroundImage?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  focusRingColor?: string;
  onPrimaryColor?: string;
  onAccentColor?: string;
  fontHeading: string;
  fontBody: string;
  cardRadius: string;
  controlRadius?: string;
  shadowStyle: string;
  spacingUnit?: string;
  density?: ThemeDensity;
  appearance: ThemeAppearance;
  imageryStyle?: string;
};

export const EA_DEFAULT_THEME_ID = 'ea-default-theme';

export const defaultWorkspaceTheme: WorkspaceTheme = {
  id: EA_DEFAULT_THEME_ID,
  organizationId: 'ea',
  name: 'Efficiency Architects',
  logo: '/ea-logo.png',
  logoAlt: 'Efficiency Architects',
  favicon: '/favicon.ico',
  heroImage: '',
  backgroundImage: '',
  primaryColor: '#0A0A0A',
  secondaryColor: '#FFFFFF',
  accentColor: '#C8941A',
  backgroundColor: '#F7F4ED',
  surfaceColor: '#FFFFFF',
  textColor: '#111111',
  mutedTextColor: '#6B7280',
  borderColor: '#E8E0D0',
  successColor: '#166534',
  warningColor: '#B45309',
  dangerColor: '#9F1239',
  focusRingColor: '#C8941A',
  onPrimaryColor: '#FFFFFF',
  onAccentColor: '#0A0A0A',
  fontHeading: "'Montserrat', 'DM Sans', sans-serif",
  fontBody: "'DM Sans', sans-serif",
  cardRadius: '8px',
  controlRadius: '8px',
  shadowStyle: '0 20px 60px rgba(0,0,0,.12)',
  spacingUnit: '8px',
  density: 'comfortable',
  appearance: 'light',
  imageryStyle: 'premium-operational',
};

/** Seed themes for known EA clients (from workspace clientConfigs). */
export const WORKSPACE_THEMES: Record<string, WorkspaceTheme> = {
  [EA_DEFAULT_THEME_ID]: defaultWorkspaceTheme,
  'cpr-theme': {
    id: 'cpr-theme',
    organizationId: 'cpr',
    name: 'Canadian Prospects Recruitment',
    logo: '',
    favicon: '',
    primaryColor: '#050505',
    secondaryColor: '#FFFFFF',
    accentColor: '#CC0000',
    backgroundColor: '#F7F7F5',
    surfaceColor: '#FFFFFF',
    textColor: '#111111',
    mutedTextColor: '#737373',
    borderColor: '#E5E5E5',
    successColor: '#15803D',
    warningColor: '#F97316',
    dangerColor: '#B91C1C',
    fontHeading: "'Montserrat', 'DM Sans', sans-serif",
    fontBody: "'DM Sans', sans-serif",
    cardRadius: '8px',
    shadowStyle: '0 18px 44px rgba(0,0,0,.14)',
    appearance: 'light',
    imageryStyle: 'basketball-recruiting',
  },
  'etfm-theme': {
    id: 'etfm-theme',
    organizationId: 'etfm',
    name: 'ETFM',
    logo: '',
    favicon: '',
    primaryColor: '#0F2742',
    secondaryColor: '#FFFFFF',
    accentColor: '#18B7C9',
    backgroundColor: '#F3F8FA',
    surfaceColor: '#FFFFFF',
    textColor: '#102033',
    mutedTextColor: '#64748B',
    borderColor: '#D7E5EA',
    successColor: '#047857',
    warningColor: '#B7791F',
    dangerColor: '#B91C1C',
    fontHeading: "'Montserrat', 'DM Sans', sans-serif",
    fontBody: "'DM Sans', sans-serif",
    cardRadius: '8px',
    shadowStyle: '0 18px 48px rgba(15,39,66,.14)',
    appearance: 'light',
    imageryStyle: 'calm-financial-progress',
  },
  '3hc-theme': {
    id: '3hc-theme',
    organizationId: '3hc',
    name: '3HC',
    logo: '',
    favicon: '',
    primaryColor: '#123D3A',
    secondaryColor: '#FFFFFF',
    accentColor: '#2A9D8F',
    backgroundColor: '#F5FAF8',
    surfaceColor: '#FFFFFF',
    textColor: '#13201F',
    mutedTextColor: '#667370',
    borderColor: '#D8E7E3',
    successColor: '#047857',
    warningColor: '#B45309',
    dangerColor: '#B91C1C',
    fontHeading: "'Montserrat', 'DM Sans', sans-serif",
    fontBody: "'DM Sans', sans-serif",
    cardRadius: '8px',
    shadowStyle: '0 18px 48px rgba(18,61,58,.13)',
    appearance: 'light',
    imageryStyle: 'healthcare-readiness',
  },
  'bob-rumball-theme': {
    id: 'bob-rumball-theme',
    organizationId: 'bob-rumball',
    name: 'Bob Rumball',
    logo: '',
    favicon: '',
    primaryColor: '#102A43',
    secondaryColor: '#FFFFFF',
    accentColor: '#F2C94C',
    backgroundColor: '#F7FAFC',
    surfaceColor: '#FFFFFF',
    textColor: '#111827',
    mutedTextColor: '#4B5563',
    borderColor: '#D9E2EC',
    successColor: '#166534',
    warningColor: '#92400E',
    dangerColor: '#991B1B',
    fontHeading: "'Montserrat', 'DM Sans', sans-serif",
    fontBody: "'DM Sans', sans-serif",
    cardRadius: '8px',
    shadowStyle: '0 18px 48px rgba(16,42,67,.13)',
    appearance: 'light',
    imageryStyle: 'accessibility-first-learning',
  },
};

export function getWorkspaceTheme(idOrOrg?: string): WorkspaceTheme {
  if (!idOrOrg) return defaultWorkspaceTheme;
  if (WORKSPACE_THEMES[idOrOrg]) return WORKSPACE_THEMES[idOrOrg];
  const byOrg = Object.values(WORKSPACE_THEMES).find((t) => t.organizationId === idOrOrg);
  return byOrg ?? defaultWorkspaceTheme;
}

export function normalizeWorkspaceTheme(theme: Partial<WorkspaceTheme> = {}): WorkspaceTheme {
  const base = getWorkspaceTheme(theme.id ?? theme.organizationId);
  const density = theme.density;
  return {
    ...base,
    ...theme,
    id: String(theme.id || base.id),
    organizationId: String(theme.organizationId || base.organizationId),
    name: String(theme.name || base.name),
    logoAlt: String(theme.logoAlt || theme.name || base.logoAlt || base.name),
    density:
      density === 'compact' || density === 'comfortable' || density === 'spacious'
        ? density
        : base.density ?? 'comfortable',
    appearance: theme.appearance === 'dark' ? 'dark' : 'light',
  };
}

/** CSS custom properties for Workspace Engine shells. */
export function workspaceThemeToCssVars(
  theme: Partial<WorkspaceTheme> = {},
): Record<string, string> {
  const t = normalizeWorkspaceTheme(theme);
  return {
    '--workspace-primary': t.primaryColor,
    '--workspace-secondary': t.secondaryColor,
    '--workspace-accent': t.accentColor,
    '--workspace-background': t.backgroundColor,
    '--workspace-surface': t.surfaceColor,
    '--workspace-text': t.textColor,
    '--workspace-muted-text': t.mutedTextColor,
    '--workspace-border': t.borderColor,
    '--workspace-success': t.successColor,
    '--workspace-warning': t.warningColor,
    '--workspace-danger': t.dangerColor,
    '--workspace-font-heading': t.fontHeading,
    '--workspace-font-body': t.fontBody,
    '--workspace-card-radius': t.cardRadius,
    '--workspace-control-radius': t.controlRadius ?? t.cardRadius,
    '--workspace-shadow': t.shadowStyle,
    '--workspace-space': t.spacingUnit ?? '8px',
    '--workspace-focus-ring': t.focusRingColor ?? t.accentColor,
    '--workspace-on-primary': t.onPrimaryColor ?? '#FFFFFF',
    '--workspace-on-accent': t.onAccentColor ?? t.primaryColor,
    '--workspace-density-scale':
      t.density === 'compact' ? '0.86' : t.density === 'spacious' ? '1.14' : '1',
    '--workspace-overlay-soft':
      t.appearance === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    '--workspace-overlay-medium':
      t.appearance === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
  };
}

export function listWorkspaceThemes(): WorkspaceTheme[] {
  return Object.values(WORKSPACE_THEMES);
}
