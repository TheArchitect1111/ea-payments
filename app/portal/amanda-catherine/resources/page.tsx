import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
import { amandaMemberResources } from '@/lib/amanda-catherine/member-resources';
export const dynamic = 'force-dynamic';

export default async function AmandaMemberResources() {
  const { session } = await requirePortalModule('amanda-catherine', 'dashboard');
  if (!session.email) redirect('/portal/login?next=%2Fportal%2Famanda-catherine%2Fresources');
  const ids = await getAmandaAssignedCourseIds('amanda-catherine', session.email);
  const resources = amandaMemberResources(ids);
  return <PortalSubpage slug="amanda-catherine" active="resources" kicker="Your resources" title="Member Resources" lede="Materials for your purchased courses and private deliveries.">
    <ul className="ep-module-list">{resources.map(resource => <li key={resource.id} className="ep-module-card">
      <Link className="ep-module-card-title" href={`/api/portal/amanda/resources/${encodeURIComponent(resource.id)}`}>{resource.title}</Link>
      <p>{resource.description}</p>
    </li>)}</ul>
    {resources.length ? null : <p>No purchased READY course resources are assigned to your account.</p>}
    <p><Link href="/portal/amanda-catherine/deliveries">Open your private deliveries</Link></p>
  </PortalSubpage>;
}
