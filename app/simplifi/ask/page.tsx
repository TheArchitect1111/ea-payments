import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { loadSimplifiWorkspace } from '@/lib/simplifi-core';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import SimplifiAppChrome from '../components/SimplifiAppChrome';
import AskClient from './AskClient';
import '../workspace/simplifi-workspace.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiAskPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;

  let objects = [] as Awaited<ReturnType<typeof loadSimplifiWorkspace>>['activeObjects'];
  let actionCenter = {
    needsAttention: [] as Awaited<ReturnType<typeof loadSimplifiWorkspace>>['actionCenter']['needsAttention'],
    recommended: [] as Awaited<ReturnType<typeof loadSimplifiWorkspace>>['actionCenter']['recommended'],
    watchlist: [] as Awaited<ReturnType<typeof loadSimplifiWorkspace>>['actionCenter']['watchlist'],
  };
  let greeting = 'Good morning.';

  if (slug) {
    const client = await getClientByPortalSlug(slug);
    const firstName = client?.clientName?.split(' ')[0] ?? '';
    const workspace = await loadSimplifiWorkspace(slug, EA_PLATFORM_URL, firstName);
    objects = workspace.activeObjects;
    actionCenter = workspace.actionCenter;
    greeting = workspace.brief.greeting;
  }

  return (
    <div className="sw-app">
      <SimplifiAppChrome active="brief" slug={slug} />
      <main className="sw-main">
        <AskClient
          greeting={greeting}
          loggedIn={Boolean(session)}
          objects={objects}
          actionCenter={actionCenter}
        />
      </main>
    </div>
  );
}
