import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { loadOrbWorkspaceSlice } from '@/lib/orb';
import OrbOsShell from './OrbOsShell';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ chat?: string; orb?: string }> };

/** Default: Brief home. Experimental chat-first shell only with ?chat=1. */
export default async function OrbOsPage({ searchParams }: Props) {
  const params = await searchParams;
  if (params.chat !== '1') {
    redirect('/simplifi/workspace');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;
  const slice = await loadOrbWorkspaceSlice(slug);

  return (
    <OrbOsShell
      slug={slug}
      loggedIn={Boolean(session)}
      firstName={slice.firstName}
      brief={slice.brief}
      objects={slice.objects}
      actionCenter={slice.actionCenter}
    />
  );
}
