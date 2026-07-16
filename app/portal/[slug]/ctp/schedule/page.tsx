import { redirect } from 'next/navigation';
import { opportunityReviewPath } from '@/lib/ctp-opportunity-routes';
import { requirePortalModule } from '@/lib/modules/portal-modules';

export const dynamic = 'force-dynamic';

/** Legacy schedule URL — canonical booking surface is Opportunity Review. */
export default async function PortalCtpSchedulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requirePortalModule(slug, 'ctp');
  redirect(opportunityReviewPath(slug));
}
