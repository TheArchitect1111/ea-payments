import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
export const dynamic = 'force-dynamic';

export default async function AmandaMemberProfile() {
  const { session } = await requirePortalModule('amanda-catherine', 'dashboard');
  if (!session.email) redirect('/portal/login?next=%2Fportal%2Famanda-catherine%2Fprofile');
  return <PortalSubpage slug="amanda-catherine" active="member" kicker="Member account" title="Member Profile" lede="Your signed-in Amanda Catherine account.">
    <section className="ep-module-card"><dl>
      <dt>Email</dt><dd>{session.email}</dd>
      <dt>Portal</dt><dd>{session.slug}</dd>
      <dt>Role</dt><dd>{session.role || 'guest'}</dd>
    </dl></section>
  </PortalSubpage>;
}
