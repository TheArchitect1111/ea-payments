import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { loadSimplifiWorkspace, type SimplifiWorkspaceData } from '@/lib/simplifi-core';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { isOrbOsPreviewEnabled, ORB_OS_PREVIEW_COOKIE } from '@/lib/orb-os';
import { redirect } from 'next/navigation';
import OrbOsShell from './OrbOsShell';

export const dynamic = 'force-dynamic';

const EMPTY: SimplifiWorkspaceData = {
  objects: [],
  activeObjects: [],
  brief: {
    greeting: 'Good morning.',
    items: [],
    recommendedNext: { label: 'Capture something worth exploring', href: '/simplifi/capture' },
    completed: [],
  },
  memoryLibrary: [],
  actionCenter: { needsAttention: [], recommended: [], watchlist: [] },
  relationships: [],
};

type Props = { searchParams: Promise<{ orb?: string }> };

export default async function OrbOsPage({ searchParams }: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const preview = isOrbOsPreviewEnabled({
    cookieValue: cookieStore.get(ORB_OS_PREVIEW_COOKIE)?.value,
    queryOrb: params.orb,
  });

  // Allow deep link ?orb=1 even when cookie unset — set path stays available.
  if (!preview && params.orb !== '1') {
    redirect('/simplifi/workspace');
  }

  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;

  let workspace = EMPTY;
  let firstName = '';
  if (slug) {
    const client = await getClientByPortalSlug(slug);
    firstName = client?.clientName?.split(' ')[0] ?? '';
    workspace = await loadSimplifiWorkspace(slug, EA_PLATFORM_URL, firstName);
  }

  return (
    <OrbOsShell
      slug={slug}
      loggedIn={Boolean(session)}
      firstName={firstName}
      brief={workspace.brief}
      objects={workspace.activeObjects}
      actionCenter={workspace.actionCenter}
    />
  );
}
