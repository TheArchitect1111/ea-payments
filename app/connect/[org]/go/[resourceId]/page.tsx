import { getConnectOrg } from '@/lib/connect-store';
import ConnectResourceGate from './ConnectResourceGate';
import '../../connect.css';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ org: string; resourceId: string }>;
  searchParams: Promise<{
    event?: string;
    rep?: string;
    source?: string;
    campaign?: string;
  }>;
};

/** Resource-first scan destination — branded offer/PDF/material, then capture + nurture. */
export default async function ConnectResourcePage({ params, searchParams }: Props) {
  const { org: orgSlug, resourceId } = await params;
  const query = await searchParams;
  const org = await getConnectOrg(orgSlug);
  const resource = org.resources.find((item) => item.id === resourceId);

  if (!resource) {
    return (
      <main className="connect-site">
        <section className="connect-shell">
          <h1>Resource not found</h1>
          <p>This Connect link may be outdated. Try the main capture page.</p>
          <a href={`/connect/${orgSlug}`}>Open {org.name} Connect</a>
        </section>
      </main>
    );
  }

  return (
    <ConnectResourceGate
      org={org}
      resource={resource}
      event={query.event}
      representative={query.rep}
      source={query.source}
      campaignId={query.campaign}
    />
  );
}
