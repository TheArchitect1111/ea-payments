import type { ReactNode } from 'react';

import { PortalLayout } from './PortalLayout';



export type EAPortalTab =

  | 'home'

  | 'pulse'

  | 'simplifi'

  | 'amplifi'

  | 'updates'

  | 'documents'

  | 'events'

  | 'resources'

  | 'messaging'

  | 'learning'

  | 'ask';



const NAVY = '#1B2B4D';

const GOLD = '#C9A844';



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


