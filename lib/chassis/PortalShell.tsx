import type { CSSProperties, ReactNode } from 'react';
import { EAPortalNav } from './EAPortalNav';
import type { PortalNavTab } from '@/lib/modules/portal-modules';

export type EAPortalTab = 'home' | 'pulse' | 'simplifi' | 'amplifi' | 'updates';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

type Props = {
  slug: string;
  active: EAPortalTab;
  firstName?: string;
  navTabs?: PortalNavTab[];
  children?: ReactNode;
};

/** EA client portal — modern soft-UI shell with pill navigation. */
export function PortalShell({ slug, active, firstName, navTabs, children }: Props) {
  return (
    <div
      className="ea-shell"
      style={
        {
          '--ea-navy': NAVY,
          '--ea-gold': GOLD,
        } as CSSProperties
      }
    >
      <EAPortalNav slug={slug} active={active} firstName={firstName} navTabs={navTabs} />
      {children}
    </div>
  );
}

export { NAVY, GOLD };
