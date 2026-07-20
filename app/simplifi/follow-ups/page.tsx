import { cookies } from 'next/headers';
import Link from 'next/link';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { loadOrbWorkspaceSlice } from '@/lib/orb';
import { buildExpirationAlerts } from '@/lib/smart-expiration';
import SimplifiProductShell from '../components/SimplifiProductShell';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';
import FollowUpActions from './FollowUpActions';
import FollowUpsReminderMount from './FollowUpsReminderMount';
import '../workspace/simplifi-workspace.css';

export const dynamic = 'force-dynamic';

export default async function FollowUpsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;
  const slice = await loadOrbWorkspaceSlice(slug);
  const alerts = buildExpirationAlerts(slice.objects);
  const dated = [...slice.objects]
    .filter((o) => o.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

  return (
    <SimplifiProductShell
      active="inbox"
      slug={slug}
      loggedIn={Boolean(session)}
      brief={slice.brief}
      objects={slice.objects}
      actionCenter={slice.actionCenter}
    >
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
            <FollowUpsReminderMount
              items={dated
                .filter((o) => o.dueDate)
                .map((o) => ({ id: o.id, title: o.title, dueDate: o.dueDate as string }))}
            />
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
                    <FollowUpActions
                      key={obj.id}
                      recordId={obj.id}
                      title={obj.title}
                      nextAction={obj.nextAction}
                      dueDate={obj.dueDate}
                    />
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
    </SimplifiProductShell>
  );
}
