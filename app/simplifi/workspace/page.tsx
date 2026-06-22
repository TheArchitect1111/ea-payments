import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { getPortalCaptures } from '@/lib/capture-records';
import { captureToObject, sortInbox, buildDailyBrief } from '@/lib/simplifi-objects';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import { isTerminalOutcome } from '@/lib/outcome-tracking';
import { objectsToMemoryLibrary } from '@/lib/memory-assets';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import SimplifiWorkspace from './SimplifiWorkspace';
import './simplifi-workspace.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiWorkspacePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;

  let firstName = '';
  let objects: SimplifiObject[] = [];

  if (slug) {
    const [client, captures] = await Promise.all([
      getClientByPortalSlug(slug),
      getPortalCaptures(slug, 30),
    ]);
    firstName = client?.clientName?.split(' ')[0] ?? '';
    objects = sortInbox(
      captures
        .filter((c) => c.status !== 'Archived')
        .map((c) => captureToObject(c, EA_PLATFORM_URL)),
    );
  }

  const brief = buildDailyBrief(objects, firstName, slug ?? undefined);
  const memoryLibrary = objectsToMemoryLibrary(objects.filter((o) => !isTerminalOutcome(o.outcomeStatus)));
  const activeObjects = objects.filter((o) => !isTerminalOutcome(o.outcomeStatus));

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
        objects={activeObjects}
        brief={brief}
        memoryLibrary={memoryLibrary}
      />
    </div>
  );
}
