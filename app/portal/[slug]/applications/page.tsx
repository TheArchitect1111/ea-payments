import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalFormSubmissions } from '@/lib/portal-forms/store';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import Link from 'next/link';
import IntakeStaffPanel from '@/app/portal/[slug]/intake/IntakeStaffPanel';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session, client } = await requirePortalModule(slug, 'applications');
  const canManage = roleAtLeast(normalizeRole(session.role), 'staff');
  const submissions = await listPortalFormSubmissions(slug, {
    kind: 'application',
    email: canManage ? undefined : session.email,
  });

  return (
    <PortalSubpage
      slug={slug}
      active="applications"
      kicker="Applications"
      title={canManage ? 'Application queue' : 'My applications'}
      lede={
        canManage
          ? `Review and update application status for ${client.organization || client.clientName}.`
          : `Track applications you submitted to ${client.organization || client.clientName}.`
      }
    >
      {!canManage && submissions.length === 0 ? (
        <div className="ep-module-card">
          <p className="ep-module-card-note">No applications on file for your email yet.</p>
          <p style={{ marginTop: 12 }}>
            <Link href={`/portal/${slug}/apply`} className="ep-btn">
              Submit an application
            </Link>
          </p>
        </div>
      ) : null}
      <IntakeStaffPanel submissions={submissions} canManage={canManage} />
      {!canManage && submissions.length > 0 ? (
        <p style={{ marginTop: 16 }}>
          <Link href={`/portal/${slug}/apply`} className="ep-muted-link">
            Submit another application →
          </Link>
        </p>
      ) : null}
    </PortalSubpage>
  );
}
