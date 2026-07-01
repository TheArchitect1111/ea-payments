import Link from 'next/link';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import '../capture/simplifi-capture.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;

  return (
    <div className="sc-app">
      <header className="sc-header">
        <Link href="/simplifi/workspace" className="sc-back">
          ← Workspace
        </Link>
        <span className="sc-kicker">Simplifi</span>
      </header>

      <main className="sc-main">
        <h1 className="sc-title" style={{ fontSize: '1.75rem' }}>
          Settings
        </h1>
        <p className="sc-lede">Account, notifications, and capture preferences.</p>

        <section className="sc-card" style={{ marginTop: 24 }}>
          <h2 className="sc-label">Account</h2>
          {session ? (
            <p className="sc-note">
              Signed in{session.email ? ` as ${session.email}` : ''}
              {slug ? ` · portal ${slug}` : ''}
            </p>
          ) : (
            <Link href="/simplifi/login?next=/simplifi/settings" className="sc-btn sc-btn-primary">
              Sign in
            </Link>
          )}
        </section>

        <section className="sc-card" style={{ marginTop: 16 }}>
          <h2 className="sc-label">Capture &amp; extension</h2>
          <ul className="sc-settings-links">
            <li>
              <Link href="/extension/connect">Connect browser extension</Link>
            </li>
            <li>
              <Link href="/amplifi/install">Install Amplifi share tools</Link>
            </li>
            <li>
              <Link href="/simplifi/capture">PWA quick capture</Link>
            </li>
          </ul>
        </section>

        <section className="sc-card" style={{ marginTop: 16 }}>
          <h2 className="sc-label">Notifications</h2>
          <p className="sc-note">
            {slug ? (
              <Link href={`/portal/${slug}/notifications`}>Open notification center</Link>
            ) : (
              'Sign in to manage notification preferences.'
            )}
          </p>
        </section>

        {slug ? (
          <section className="sc-card" style={{ marginTop: 16 }}>
            <h2 className="sc-label">Portal</h2>
            <Link href={`/portal/${slug}`} className="sc-btn sc-btn-ghost">
              Open EA portal home
            </Link>
          </section>
        ) : null}
      </main>
    </div>
  );
}
