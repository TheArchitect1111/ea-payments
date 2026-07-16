import { cookies } from 'next/headers';
import Link from 'next/link';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { loadSimplifiWorkspace } from '@/lib/simplifi-core';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { priorityLevelLabel } from '@/lib/priority-engine';
import SimplifiAppChrome from '../components/SimplifiAppChrome';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';
import '../workspace/simplifi-workspace.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiInboxPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;

  let objects = [] as Awaited<ReturnType<typeof loadSimplifiWorkspace>>['activeObjects'];
  if (slug) {
    const client = await getClientByPortalSlug(slug);
    const firstName = client?.clientName?.split(' ')[0] ?? '';
    const workspace = await loadSimplifiWorkspace(slug, EA_PLATFORM_URL, firstName);
    objects = workspace.activeObjects;
  }

  return (
    <div className="sw-app">
      <SimplifiAppChrome active="inbox" slug={slug} />
      <main className="sw-main">
        <section className="sw-brief-intro">
          <p>Opportunity Center</p>
          <h1>Inbox</h1>
          <p className="sw-muted">Everything captured, ordered by what deserves attention.</p>
        </section>

        {!session ? (
          <EmptyStateGuide
            title="Sign in to see your inbox"
            explanation="Your opportunities stay tied to your portal. Sign in, then capture — they land here."
            actionLabel="Sign in"
            actionHref="/simplifi/login?next=/simplifi/inbox"
          />
        ) : objects.length === 0 ? (
          <EmptyStateGuide
            title="Inbox is clear"
            explanation="Capture a link, note, or screenshot — Simplifi will score it and put it here."
            actionLabel="Quick capture"
            actionHref="/simplifi/capture"
          />
        ) : (
          <ul className="sw-inbox-list">
            {objects.map((obj) => (
              <li key={obj.id} className="sw-card">
                <Link href={`/simplifi/opportunity/${obj.id}`} className="sw-card-head">
                  <div>
                    <span className={`sw-priority sw-priority-${obj.priority.toLowerCase()}`}>{obj.priority}</span>
                    {obj.priorityLevel && obj.priorityLevel !== 'low' ? (
                      <span className={`sw-dyn-priority sw-dyn-${obj.priorityLevel}`}>
                        {priorityLevelLabel(obj.priorityLevel)}
                      </span>
                    ) : null}
                    <h3>{obj.title}</h3>
                    <p className="sw-card-meta">
                      {obj.type}
                      {obj.opportunityScore != null ? ` · ${obj.opportunityScore}/100` : ''}
                      {obj.dueDate ? ` · due ${obj.dueDate}` : ''}
                    </p>
                    <p className="sw-next-action">Next: {obj.nextAction}</p>
                  </div>
                  <span className="sw-chevron">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <section className="sw-quick-actions" aria-label="Inbox shortcuts">
          <Link href="/simplifi/workspace">Brief</Link>
          <Link href="/simplifi/capture">Capture</Link>
          <Link href="/simplifi/follow-ups">Follow-ups</Link>
          <Link href="/simplifi/calendar">Calendar</Link>
        </section>
      </main>
    </div>
  );
}
