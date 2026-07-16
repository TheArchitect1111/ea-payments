import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { loadOrbWorkspaceSlice } from '@/lib/orb';
import SimplifiProductShell from '../components/SimplifiProductShell';
import AskClient from './AskClient';
import '../workspace/simplifi-workspace.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiAskPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;
  const slice = await loadOrbWorkspaceSlice(slug);

  return (
    <SimplifiProductShell
      active="brief"
      slug={slug}
      loggedIn={Boolean(session)}
      brief={slice.brief}
      objects={slice.objects}
      actionCenter={slice.actionCenter}
    >
      <main className="sw-main">
        <AskClient
          greeting={slice.brief.greeting}
          loggedIn={Boolean(session)}
          objects={slice.objects}
          actionCenter={slice.actionCenter}
        />
      </main>
    </SimplifiProductShell>
  );
}
