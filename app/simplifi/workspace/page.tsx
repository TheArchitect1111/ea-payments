import { cookies } from 'next/headers';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { loadSimplifiWorkspace, type SimplifiWorkspaceData } from '@/lib/simplifi-core';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import SimplifiAppChrome from '../components/SimplifiAppChrome';
import SimplifiWorkspace from './SimplifiWorkspace';
import './simplifi-workspace.css';

export const dynamic = 'force-dynamic';

const EMPTY_WORKSPACE: SimplifiWorkspaceData = {
  objects: [],
  activeObjects: [],
  brief: {
    greeting: 'Good morning.',
    items: [],
    recommendedNext: { label: 'Capture something worth exploring', href: '/simplifi/capture' },
    completed: [],
  },
  memoryLibrary: [],
  actionCenter: { needsAttention: [], recommended: [], watchlist: [] },
  relationships: [],
};

export default async function SimplifiWorkspacePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;

  let workspace: SimplifiWorkspaceData = EMPTY_WORKSPACE;

  if (slug) {
    const client = await getClientByPortalSlug(slug);
    const firstName = client?.clientName?.split(' ')[0] ?? '';
    workspace = await loadSimplifiWorkspace(slug, EA_PLATFORM_URL, firstName);
  }

  return (
    <div className="sw-app">
      <SimplifiAppChrome active="brief" slug={slug} />
      <SimplifiWorkspace
        slug={slug}
        loggedIn={Boolean(session)}
        objects={workspace.activeObjects}
        brief={workspace.brief}
        memoryLibrary={workspace.memoryLibrary}
        actionCenter={workspace.actionCenter}
        relationships={workspace.relationships}
      />
    </div>
  );
}
