import type { ReactNode } from 'react';

import { PortalLayout } from './PortalLayout';
import { NAVY, GOLD } from '@/lib/design-system';

export type EAPortalTab =
  | 'home'
  | 'pulse'
  | 'simplifi'
  | 'amplifi'
  | 'connect'
  | 'updates'
  | 'documents'
  | 'events'
  | 'resources'
  | 'messaging'
  | 'learning'
  | 'ask';



type Props = {

  slug: string;

  active: EAPortalTab;

  firstName?: string;

  pageTitle?: string;

  children: ReactNode;

};



/** EA client portal — TailAdmin-style sidebar shell (portal routes only). */

export function PortalShell({ slug, active, firstName, pageTitle, children }: Props) {

  const titles: Record<EAPortalTab, string> = {

    home: 'Dashboard',

    pulse: 'Pulse™',

    simplifi: 'Simplifi™',

    amplifi: 'Amplifi™',
    connect: 'EA Connect™',
    updates: 'Update Hub™',

    documents: 'Documents',

    events: 'Events',

    resources: 'Resources',

    messaging: 'Messages',

    learning: 'Learning',

    ask: 'Ask EA',

  };



  return (

    <PortalLayout

      slug={slug}

      active={active}

      firstName={firstName}

      pageTitle={pageTitle ?? titles[active] ?? 'Dashboard'}

    >

      {children}

    </PortalLayout>

  );

}



export { NAVY, GOLD };


