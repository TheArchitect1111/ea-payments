import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalFormSubmissions } from '@/lib/portal-forms/store';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import IntakeFormClient from './IntakeFormClient';
import IntakeStaffPanel from './IntakeStaffPanel';

export const dynamic = 'force-dynamic';

export default async function IntakePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { session, client } = await requirePortalModule(slug, 'intake');
  const canManage = roleAtLeast(normalizeRole(session.role), 'staff');
  const submissions = await listPortalFormSubmissions(slug, {
    kind: 'intake',
    email: canManage ? undefined : session.email,
  });

  return (
    <PortalSubpage
      slug={slug}
      active="intake"
      clientNavActive="intake"
      kicker="Intake"
      title="Client intake"
      lede={`Share your goals with ${client.organization || client.clientName} — we respond personally.`}
    >
      {!canManage ? (
        <IntakeFormClient
          slug={slug}
          kind="intake"
          title="Tell us what you need"
          submitLabel="Submit intake"
        />
      ) : null}
      <IntakeStaffPanel submissions={submissions} canManage={canManage} />
    </PortalSubpage>
  );
}
