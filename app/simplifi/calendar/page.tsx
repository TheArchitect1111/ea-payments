import { cookies } from 'next/headers';
import Link from 'next/link';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { loadOrbWorkspaceSlice } from '@/lib/orb';
import SimplifiProductShell from '../components/SimplifiProductShell';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';
import '../workspace/simplifi-workspace.css';

export const dynamic = 'force-dynamic';

function monthKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7) || 'Undated';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function OpportunityCalendarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;
  const slice = await loadOrbWorkspaceSlice(slug);
  const dated = slice.objects.filter((o) => o.dueDate);

  const byMonth = new Map<string, typeof dated>();
  for (const obj of dated) {
    const key = monthKey(obj.dueDate!);
    const list = byMonth.get(key) ?? [];
    list.push(obj);
    byMonth.set(key, list);
  }
  const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));

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
          <p>Commitments only</p>
          <h1>Opportunity calendar</h1>
          <p className="sw-muted">Deadlines and follow-up targets — not a full calendar product.</p>
        </section>

        {!session ? (
          <EmptyStateGuide
            title="Sign in to see commitments"
            explanation="Opportunity due dates appear here once you are signed in."
            actionLabel="Sign in"
            actionHref="/simplifi/login?next=/simplifi/calendar"
          />
        ) : months.length === 0 ? (
          <EmptyStateGuide
            title="No dated opportunities"
            explanation="Open an opportunity and set a follow-up date, or snooze from the profile."
            actionLabel="Open inbox"
            actionHref="/simplifi/inbox"
          />
        ) : (
          months.map(([month, items]) => (
            <section key={month} className="sw-brief-panel">
              <div className="sw-panel-heading">
                <h2>{month}</h2>
                <span>{items.length}</span>
              </div>
              <ul className="sw-event-list">
                {[...items]
                  .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
                  .map((obj) => (
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
            </section>
          ))
        )}

        <section className="sw-quick-actions">
          <Link href="/simplifi/follow-ups">Follow-ups</Link>
          <Link href="/simplifi/workspace">Brief</Link>
        </section>
      </main>
    </SimplifiProductShell>
  );
}
