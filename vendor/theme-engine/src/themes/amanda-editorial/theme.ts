import type { WorkspaceTheme } from '../../index';
import { amandaEditorialColors as color } from './colors';
import { amandaEditorialTypography as type } from './typography';

export const AMANDA_EDITORIAL_THEME_ID = 'amanda-editorial';

export const amandaEditorialTheme: WorkspaceTheme = {
  id: AMANDA_EDITORIAL_THEME_ID,
  organizationId: 'amanda-catherine',
  name: 'Amanda Editorial',
  primaryColor: color.ink,
  secondaryColor: color.surface,
  accentColor: color.champagne,
  backgroundColor: color.paper,
  surfaceColor: color.surface,
  textColor: color.ink,
  mutedTextColor: color.smoke,
  borderColor: color.line,
  successColor: '#436B52',
  warningColor: '#9A692D',
  dangerColor: '#8B3D37',
  focusRingColor: color.champagne,
  onPrimaryColor: color.white,
  onAccentColor: color.ink,
  fontHeading: type.display,
  fontBody: type.body,
  cardRadius: '0px',
  controlRadius: '0px',
  shadowStyle: '0 28px 80px rgba(42,32,20,.12)',
  spacingUnit: '8px',
  density: 'spacious',
  appearance: 'light',
  imageryStyle: 'warm-editorial-lifestyle',
};
