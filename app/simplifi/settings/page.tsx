import Link from 'next/link';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { loadOrbWorkspaceSlice } from '@/lib/orb';
import { CHROME_FADE_COOKIE, isChromeFadeEnabled } from '@/lib/simplifi/chrome-fade';
import SimplifiProductShell from '../components/SimplifiProductShell';
import ChromeFadeToggle from './ChromeFadeToggle';
import DueReminderToggle from '../components/DueReminderClient';
import '../workspace/simplifi-workspace.css';
import '../capture/simplifi-capture.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;
  const slice = await loadOrbWorkspaceSlice(slug);
  const chromeFade = isChromeFadeEnabled({
    cookieValue: cookieStore.get(CHROME_FADE_COOKIE)?.value,
  });
  const dueItems = slice.objects
    .filter((o) => o.dueDate)
    .map((o) => ({ id: o.id, title: o.title, dueDate: o.dueDate as string }));

  return (
    <SimplifiProductShell
      active="settings"
      slug={slug}
      loggedIn={Boolean(session)}
      brief={slice.brief}
      objects={slice.objects}
      actionCenter={slice.actionCenter}
      chromeFade={chromeFade}
    >
      <main className="sw-main">
        <section className="sw-brief-intro">
          <p>Simplifi</p>
          <h1>Settings</h1>
          <p className="sw-muted">Account, notifications, and capture preferences.</p>
        </section>

        <section className="sw-brief-panel">
          <h2>SIMPLIFI Orb</h2>
          <p className="sw-muted">
            The Orb lives in the corner of every Simplifi screen — quiet intelligence over your Brief, not a
            chatbot home. Tap it for recommendations, Ask, and voice.
          </p>
          <div style={{ marginTop: 12 }}>
            <ChromeFadeToggle initialEnabled={chromeFade} />
          </div>
          <p className="sw-muted" style={{ marginTop: 12 }}>
            Experimental chat-first shell (legacy):{' '}
            <Link href="/simplifi/orb?chat=1">/simplifi/orb?chat=1</Link>
          </p>
        </section>

        <section className="sw-brief-panel">
          <h2>Account</h2>
          {session ? (
            <p className="sw-muted">
              Signed in{session.email ? ` as ${session.email}` : ''}
              {slug ? ` · portal ${slug}` : ''}
            </p>
          ) : (
            <Link href="/simplifi/login?next=/simplifi/settings" className="sw-link">
              Sign in
            </Link>
          )}
        </section>

        <section className="sw-brief-panel">
          <h2>Capture &amp; extension</h2>
          <ul className="sw-event-list">
            <li>
              <div>
                <strong>
                  <Link href="/extension/connect">Connect browser extension</Link>
                </strong>
              </div>
            </li>
            <li>
              <div>
                <strong>
                  <Link href="/amplifi/install">Install Amplifi share tools</Link>
                </strong>
              </div>
            </li>
            <li>
              <div>
                <strong>
                  <Link href="/simplifi/capture">Quick capture</Link>
                </strong>
              </div>
            </li>
          </ul>
        </section>

        <section className="sw-brief-panel">
          <h2>Intelligence surfaces</h2>
          <ul className="sw-event-list">
            <li>
              <div>
                <strong>
                  <Link href="/simplifi/workspace">Today&apos;s Brief</Link>
                </strong>
              </div>
            </li>
            <li>
              <div>
                <strong>
                  <Link href="/simplifi/follow-ups">Follow-ups hub</Link>
                </strong>
              </div>
            </li>
            <li>
              <div>
                <strong>
                  <Link href="/simplifi/calendar">Opportunity calendar</Link>
                </strong>
              </div>
            </li>
            <li>
              <div>
                <strong>
                  <Link href="/simplifi/ask">Ask Simplifi</Link>
                </strong>
              </div>
            </li>
          </ul>
        </section>

        <section className="sw-brief-panel">
          <h2>Notifications &amp; capture prefs</h2>
          {session ? (
            <DueReminderToggle dueItems={dueItems} />
          ) : (
            <p className="sw-muted">
              <Link href="/simplifi/login?next=/simplifi/settings">Sign in</Link> to manage due
              reminders and capture tips.
            </p>
          )}
          {slug ? (
            <p className="sw-muted" style={{ marginTop: 12 }}>
              <Link href={`/portal/${slug}/notifications`}>Open portal notification center</Link>
            </p>
          ) : null}
        </section>

        {slug ? (
          <section className="sw-quick-actions">
            <Link href={`/portal/${slug}`}>EA portal home</Link>
            <Link href="/simplifi/workspace">Brief</Link>
          </section>
        ) : null}
      </main>
    </SimplifiProductShell>
  );
}
