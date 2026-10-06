import type { WorkspaceTheme } from '../../index';

export const EA_IMMERSIVE_THEME_ID = 'ea-immersive';

export const eaImmersiveTheme: WorkspaceTheme = {
  id: EA_IMMERSIVE_THEME_ID,
  organizationId: 'ea',
  name: 'EA Immersive',
  primaryColor: '#0A0A0A',
  secondaryColor: '#F5F5F3',
  accentColor: '#4D5CFF',
  backgroundColor: '#F5F5F3',
  surfaceColor: '#FFFFFF',
  textColor: '#0A0A0A',
  mutedTextColor: '#656565',
  borderColor: '#D9D9D6',
  successColor: '#166534',
  warningColor: '#B45309',
  dangerColor: '#9F1239',
  focusRingColor: '#4D5CFF',
  onPrimaryColor: '#FFFFFF',
  onAccentColor: '#FFFFFF',
  fontHeading: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  fontBody: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  cardRadius: '28px',
  controlRadius: '999px',
  shadowStyle: '0 28px 90px rgba(0,0,0,.14)',
  spacingUnit: '8px',
  density: 'spacious',
  appearance: 'light',
  imageryStyle: 'immersive-editorial-product',
};
