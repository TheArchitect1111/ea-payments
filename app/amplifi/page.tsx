import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import AmplifiPostApp from './AmplifiPostApp';
import './amplifi.css';

export const metadata: Metadata = {
  title: 'Amplifi™ — Review before posting',
  description: 'Draft share copy from Magnifi stories. Review before you post — Amplifi does not auto-publish.',
};

export const dynamic = 'force-dynamic';

export default async function AmplifiPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; title?: string; capture?: string }>;
}) {
  const { url, title, capture } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <AmplifiPostApp
      loggedIn={Boolean(session)}
      slug={session?.slug ?? null}
      captureId={capture}
      initialUrl={url}
      initialTitle={title}
    />
  );
}
