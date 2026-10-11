import { notFound } from 'next/navigation';
import { isUniversalPeopleEnabled, isPeopleRuntimeAllowed } from '@/lib/people/flags';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { roleAtLeast } from '@/lib/rbac';
import PeopleDirectory from './PeopleDirectory';
export default async function PeoplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isUniversalPeopleEnabled() || !isPeopleRuntimeAllowed()) notFound();
  const { session } = await requirePortalModule(slug, 'people');
  if (!session.role || !roleAtLeast(session.role, 'staff')) notFound();
  return <PortalSubpage slug={slug} active="people" kicker="People" title="Your relationships" lede="Keep the people you work with in one place."><PeopleDirectory slug={slug} /></PortalSubpage>;
}
