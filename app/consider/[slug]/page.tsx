import { notFound } from 'next/navigation';
import { getCaptureByConsiderSlug } from '@/lib/capture-records';
import { parseOpportunityPayload } from '@/lib/opportunity-experience';
import ConsiderExperience from './ConsiderExperience';

export const dynamic = 'force-dynamic';

export default async function ConsiderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const capture = await getCaptureByConsiderSlug(slug);

  if (!capture) {
    notFound();
  }

  const payload = parseOpportunityPayload(capture);
  if (!payload) {
    notFound();
  }

  return <ConsiderExperience payload={payload} captureId={capture.id} slug={slug} />;
}
