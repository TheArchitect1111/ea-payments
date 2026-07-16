import { cookies } from 'next/headers';
import Link from 'next/link';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { loadSimplifiWorkspace } from '@/lib/simplifi-core';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { buildExpirationAlerts } from '@/lib/smart-expiration';
import SimplifiAppChrome from '../components/SimplifiAppChrome';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';
import '../workspace/simplifi-workspace.css';

export const dynamic = 'force-dynamic';

export default async function FollowUpsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;

  let objects = [] as Awaited<ReturnType<typeof loadSimplifiWorkspace>>['activeObjects'];
  let alerts: ReturnType<typeof buildExpirationAlerts> = [];

  if (slug) {
    const client = await getClientByPortalSlug(slug);
    const firstName = client?.clientName?.split(' ')[0] ?? '';
    const workspace = await loadSimplifiWorkspace(slug, EA_PLATFORM_URL, firstName);
    objects = workspace.activeObjects;
    alerts = buildExpirationAlerts(objects);
  }

  const dated = [...objects]
    .filter((o) => o.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

  return (
    <div className="sw-app">
      <SimplifiAppChrome active="inbox" slug={slug} />
      <main className="sw-main">
        <section className="sw-brief-intro">
          <p>Stay on it</p>
          <h1>Follow-ups</h1>
          <p className="sw-muted">Due dates, snoozes, and fading opportunities in one place.</p>
        </section>

        {!session ? (
          <EmptyStateGuide
            title="Sign in for follow-ups"
            explanation="Dated next actions and expiration alerts appear here after you sign in."
            actionLabel="Sign in"
            actionHref="/simplifi/login?next=/simplifi/follow-ups"
          />
        ) : (
          <>
            {alerts.length > 0 ? (
              <section className="sw-brief-panel">
                <div className="sw-panel-heading">
                  <h2>Needs attention</h2>
                  <span>{alerts.length}</span>
                </div>
                <div className="sw-action-stack">
                  {alerts.map((alert) => (
                    <div key={alert.objectId} className={`sw-action-card sw-brief-${alert.kind}`}>
                      <div>
                        <strong>{alert.title}</strong>
                        <p>{alert.detail}</p>
                      </div>
                      <Link href={`/simplifi/opportunity/${alert.objectId}`} className="sw-link">
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="sw-brief-panel">
              <div className="sw-panel-heading">
                <h2>Dated commitments</h2>
                <span>{dated.length}</span>
              </div>
              {dated.length === 0 ? (
                <p className="sw-muted">No due dates yet. Set one from an opportunity profile or snooze from the Orb.</p>
              ) : (
                <ul className="sw-event-list">
                  {dated.map((obj) => (
                    <li key={obj.id}>
                      <div>
                        <strong>
                          <Link href={`/simplifi/opportunity/${obj.id}`}>{obj.title}</Link>
                        </strong>
                        <p>{obj.nextAction}</p>
                      </div>
                      <span>{obj.dueDate}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <section className="sw-quick-actions">
          <Link href="/simplifi/calendar">Calendar</Link>
          <Link href="/simplifi/inbox">Inbox</Link>
          <Link href="/simplifi/workspace">Brief</Link>
        </section>
      </main>
    </div>
  );
}
