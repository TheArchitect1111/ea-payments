import Link from 'next/link';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { loadOrbWorkspaceSlice } from '@/lib/orb';
import SimplifiProductShell from '../components/SimplifiProductShell';
import '../workspace/simplifi-workspace.css';
import '../capture/simplifi-capture.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;
  const slice = await loadOrbWorkspaceSlice(slug);

  return (
    <SimplifiProductShell
      active="settings"
      slug={slug}
      loggedIn={Boolean(session)}
      brief={slice.brief}
      objects={slice.objects}
      actionCenter={slice.actionCenter}
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
          <p className="sw-muted" style={{ marginTop: 8 }}>
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
          <h2>Notifications</h2>
          <p className="sw-muted">
            {slug ? (
              <Link href={`/portal/${slug}/notifications`}>Open notification center</Link>
            ) : (
              'Sign in to manage notification preferences.'
            )}
          </p>
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
