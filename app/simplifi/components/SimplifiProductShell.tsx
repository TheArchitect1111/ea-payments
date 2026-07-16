'use client';

import type { ReactNode } from 'react';
import type { ActionCenterPayload } from '@/lib/action-center';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { OrbBriefSlice } from '@/lib/orb';
import type { SimplifiNavId } from './SimplifiAppChrome';
import SimplifiAppChrome from './SimplifiAppChrome';
import GlobalOrb from './GlobalOrb';

export default function SimplifiProductShell({
  active,
  slug,
  loggedIn,
  brief,
  objects,
  actionCenter,
  entityId,
  showChrome = true,
  children,
}: {
  active: SimplifiNavId;
  slug: string | null;
  loggedIn: boolean;
  brief: OrbBriefSlice;
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
  entityId?: string | null;
  showChrome?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="sw-app" style={{ paddingBottom: 100 }}>
      {showChrome ? <SimplifiAppChrome active={active} slug={slug} /> : null}
      {children}
      <GlobalOrb
        slug={slug}
        loggedIn={loggedIn}
        brief={brief}
        objects={objects}
        actionCenter={actionCenter}
        entityId={entityId}
      />
    </div>
  );
}
