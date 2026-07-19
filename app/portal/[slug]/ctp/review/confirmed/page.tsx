import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalShell } from '@/lib/chassis/PortalShell';
import OpportunityReviewConfirmed from '@/app/portal/components/OpportunityReviewConfirmed';
import { buildCtpScheduleView } from '@/lib/ctp-schedule-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

export default async function PortalCtpOpportunityReviewConfirmedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session, client } = await requirePortalModule(slug, 'ctp');

  const submission = await getCtpSubmissionForPortal({
    portalSlug: slug,
    email: session.email ?? client.email,
  });

  if (!submission) {
    redirect(`/portal/${slug}`);
  }

  const firstName = (
    submission.contactName ||
    client.clientName ||
    session.email ||
    'there'
  )
    .trim()
    .split(/\s+/)[0];
  const schedule = buildCtpScheduleView(submission);

  return (
    <PortalShell slug={slug} active="ctp" presentation="experience" firstName={firstName}>
      <OpportunityReviewConfirmed
        firstName={firstName}
        businessName={submission.businessName}
        slug={slug}
        reviewLabel={schedule.reviewLabel}
      />
    </PortalShell>
  );
}
