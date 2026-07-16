import { cookies } from 'next/headers';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { loadOrbWorkspaceSlice } from '@/lib/orb';
import SimplifiProductShell from '../components/SimplifiProductShell';
import SimplifiCaptureApp from './SimplifiCaptureApp';
import './simplifi-capture.css';
import '../workspace/simplifi-workspace.css';

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
  const slug = session?.slug ?? null;
  const slice = await loadOrbWorkspaceSlice(slug);

  return (
    <SimplifiProductShell
      active="capture"
      slug={slug}
      loggedIn={Boolean(session)}
      brief={slice.brief}
      objects={slice.objects}
      actionCenter={slice.actionCenter}
      showChrome={false}
    >
      <SimplifiCaptureApp slug={slug} loggedIn={Boolean(session)} initialUrl={initialUrl} />
    </SimplifiProductShell>
  );
}
