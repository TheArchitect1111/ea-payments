import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import { parseCalendlyScheduledAt } from '@/lib/ctp-calendly';
import { scheduleCtpReview } from '@/lib/ctp-review-schedule';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

/**
 * Calendly return → schedule into Guide → Progress (never terminate on Journey).
 */
export default async function PortalCtpOpportunityReviewConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const { session, client } = await requirePortalModule(slug, 'ctp');

  const submission = await getCtpSubmissionForPortal({
    portalSlug: slug,
    email: session.email ?? client.email,
  });

  if (!submission) {
    redirect(`/portal/${slug}`);
  }

  const fromCalendly = parseCalendlyScheduledAt(query);
  const alreadyScheduled = Boolean(submission.reviewScheduledAt);

  if (!alreadyScheduled) {
    const when =
      fromCalendly ??
      // Booking confirmed without a timestamp — mark scheduled so NBA leaves "Schedule…"
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await scheduleCtpReview(submission.id, when);
  }

  redirect(`${designStudioPath(slug)}?meeting=confirmed`);
}
