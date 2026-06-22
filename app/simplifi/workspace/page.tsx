import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { loadSimplifiWorkspace, type SimplifiWorkspaceData } from '@/lib/simplifi-store';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
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
      <header className="sw-header">
        <Link href="/simplifi" className="sw-brand">
          SIMPLIFI
        </Link>
        <nav className="sw-nav">
          <Link href="/simplifi/capture">Capture</Link>
          {slug ? (
            <Link href={`/portal/${slug}`}>Portal</Link>
          ) : (
            <Link href="/portal/login">Sign in</Link>
          )}
        </nav>
      </header>

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
