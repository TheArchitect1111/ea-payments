import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import AmplifiPostApp from '../AmplifiPostApp';
import '../amplifi.css';
import '../idea-box-home.css';
import '../amplifi-create.css';

export const metadata: Metadata = {
  title: 'Amplifi Workspace — Review before publishing',
  description: 'Create, verify, approve, schedule, and publish campaign content in Amplifi.',
};

export const dynamic = 'force-dynamic';

export default async function AmplifiWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; title?: string; capture?: string }>;
}) {
  const { url, title, capture } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <>
      {session ? (
        <section className="af-workspace-create-launcher" aria-label="Create with Amplifi">
          <div>
            <small>CREATE WITH AMPLIFI</small>
            <h2>What do you want to make?</h2>
            <p>Start with the job. Amplifi handles the creative structure underneath.</p>
          </div>
          <nav>
            <a href="/amplifi/create?mode=post"><strong>Post</strong><span>One finished idea</span></a>
            <a href="/amplifi/create?mode=series"><strong>Series</strong><span>A coordinated recurring set</span></a>
            <a href="/amplifi/create?mode=campaign"><strong>Campaign</strong><span>A goal-driven campaign</span></a>
          </nav>
        </section>
      ) : null}
      <AmplifiPostApp
        loggedIn={Boolean(session)}
        slug={session?.slug ?? null}
        captureId={capture}
        initialUrl={url}
        initialTitle={title}
      />
    </>
  );
}
