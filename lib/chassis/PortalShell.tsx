import type { ReactNode } from 'react';
import type { ModuleId } from '@/lib/modules/registry';
import type { ShellNavGroup } from '@/lib/modules/portal-modules';
import { AppShell } from './AppShell';
import { NAVY, GOLD } from '@/lib/design-system';

export type EAPortalTab = 'home' | 'pulse' | 'simplifi' | 'amplifi' | 'updates';

const TAB_TO_MODULE: Record<EAPortalTab, ModuleId> = {
  home: 'dashboard',
  pulse: 'pulse',
  simplifi: 'simplifi',
  amplifi: 'amplifi',
  updates: 'update-hub',
};

type Props = {
  slug: string;
  active: EAPortalTab;
  firstName?: string;
  shellNavGroups?: ShellNavGroup[];
  activeModuleId?: ModuleId;
  children: ReactNode;
};

/** EA client portal — Pulse OS shell with entitlement-driven sidebar navigation. */
export function PortalShell({
  slug,
  active,
  firstName,
  shellNavGroups,
  activeModuleId,
  children,
}: Props) {
  return (
    <AppShell
      slug={slug}
      firstName={firstName}
      shellNavGroups={shellNavGroups}
      activeModuleId={activeModuleId ?? TAB_TO_MODULE[active]}
    >
      {children}
    </AppShell>
  );
}

export { NAVY, GOLD };
