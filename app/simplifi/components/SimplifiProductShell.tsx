'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { ActionCenterPayload } from '@/lib/action-center';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { OrbBriefSlice } from '@/lib/orb';
import {
  CHROME_FADE_CHANGE_EVENT,
  resolveChromeFadeClient,
} from '@/lib/simplifi/chrome-fade';
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
  chromeFade: chromeFadeProp,
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
  /** Optional server hint; client preference wins after hydrate. */
  chromeFade?: boolean;
  children: ReactNode;
}) {
  const [chromeFade, setChromeFade] = useState(Boolean(chromeFadeProp));

  useEffect(() => {
    setChromeFade(resolveChromeFadeClient());
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      if (typeof detail?.enabled === 'boolean') {
        setChromeFade(detail.enabled);
        return;
      }
      setChromeFade(resolveChromeFadeClient());
    };
    window.addEventListener(CHROME_FADE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHROME_FADE_CHANGE_EVENT, onChange);
  }, []);

  return (
    <div
      className={chromeFade ? 'sw-app sw-app--chrome-fade' : 'sw-app'}
      style={{ paddingBottom: chromeFade ? 88 : 100 }}
      data-chrome-fade={chromeFade ? '1' : '0'}
    >
      {showChrome ? (
        <SimplifiAppChrome active={active} slug={slug} chromeFade={chromeFade} />
      ) : null}
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
