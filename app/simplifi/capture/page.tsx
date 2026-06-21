import { cookies } from 'next/headers';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import SimplifiCaptureApp from './SimplifiCaptureApp';
import './simplifi-capture.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiCapturePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url: initialUrl } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <SimplifiCaptureApp
      slug={session?.slug ?? null}
      loggedIn={Boolean(session)}
      initialUrl={initialUrl}
    />
  );
}
