export type OperatingMode = 'executive' | 'builder';

export const EA_OPERATING_MODE_KEY = 'ea_operating_mode';

/** Mission Control / executive OS operate nav (TailAdmin sidebar). */
export const EXECUTIVE_NAV = [
  { href: '/admin/master', label: 'Home' },
  { href: '/admin/delivery', label: 'Clients' },
  { href: '/admin/ctp', label: 'CTP' },
  { href: '/admin/content-requests', label: 'Content' },
  { href: '/admin/simplifi', label: 'Opportunities' },
  { href: '/admin/dashboard', label: 'Pipeline' },
  { href: '/admin/factory', label: 'Factory' },
] as const;

export const BUILDER_NAV = [
  { href: '/admin/ea-factory', label: 'EA Factory' },
  { href: '/admin/capability-marketplace', label: 'Capabilities' },
  { href: '/admin/workspace-preview', label: 'Workspace Preview' },
  { href: '/admin/protocol-center', label: 'Protocols' },
  { href: '/admin/ea-factory/repo-library', label: 'Repositories' },
  { href: '/admin/ea-factory/project-generator', label: 'Project Generator' },
  { href: '/admin/ea-factory/skin-factory', label: 'Skin Factory' },
  { href: '/admin/ea-factory/codex-builder', label: 'Codex Builder' },
  { href: '/admin/ea-factory/chassis-deployment', label: 'Chassis Deploy' },
  { href: '/admin/blueprints', label: 'Blueprints' },
  { href: '/admin/ea-factory/launches', label: 'EACP Launches' },
] as const;

export function readOperatingMode(): OperatingMode {
  if (typeof window === 'undefined') return 'executive';
  const stored = window.localStorage.getItem(EA_OPERATING_MODE_KEY);
  return stored === 'builder' ? 'builder' : 'executive';
}

export function writeOperatingMode(mode: OperatingMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EA_OPERATING_MODE_KEY, mode);
  window.dispatchEvent(new CustomEvent('ea:operating-mode-change', { detail: mode }));
}
